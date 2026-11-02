from datetime import date, timedelta
from unittest.mock import patch

from django.utils import timezone
from rest_framework.test import APITestCase

from usuarios.models import Alergia, Usuario
from .models import Agenda, Vacina


class VacinacaoAPITests(APITestCase):
    def setUp(self):
        self.usuario = Usuario.objects.create(
            nome="Maria", data_nascimento=date(2000, 5, 20), sexo="F",
            logradouro="Rua A", numero=10, setor="Centro", cidade="Goiânia", uf="GO",
        )
        self.vacina = Vacina.objects.create(titulo="Vacina de teste", doses=1)
        self.dados = {
            "usuario": self.usuario.pk, "vacina": self.vacina.pk,
            "data": "2026-11-02", "hora": "09:30:00", "observacoes": "Primeira visita",
        }

    def agendar(self, **dados):
        return self.client.post("/api/agendas/", {**self.dados, **dados}, format="json")

    def test_vacina_inclusao_consulta_listagem_e_exclusao(self):
        response = self.client.post("/api/vacinas/", {
            "titulo": "Vacina A", "descricao": "Descrição", "doses": 3,
            "periodicidade": 3, "intervalo": 2,
        }, format="json")
        self.assertEqual(response.status_code, 201)
        url = f"/api/vacinas/{response.data['id']}/"
        self.assertEqual(self.client.get(url).data["doses"], 3)
        self.assertEqual(len(self.client.get("/api/vacinas/").data), 2)
        self.assertEqual(self.client.delete(url).status_code, 204)

    def test_vacina_dose_unica_dispensa_intervalo_e_periodicidade(self):
        response = self.client.post("/api/vacinas/", {"titulo": "Única", "doses": 1}, format="json")
        self.assertEqual(response.status_code, 201)
        self.assertIsNone(response.data["intervalo"])
        self.assertIsNone(response.data["periodicidade"])

    def test_rejeita_configuracoes_invalidas_de_vacina(self):
        for dados in [
            {}, {"doses": 0}, {"doses": -1}, {"doses": 1.5},
            {"doses": 2}, {"doses": 2, "periodicidade": 1},
            {"doses": 2, "periodicidade": 9, "intervalo": 1},
            {"doses": 2, "periodicidade": 1, "intervalo": 0},
            {"doses": 2, "periodicidade": None, "intervalo": None},
        ]:
            with self.subTest(dados=dados):
                response = self.client.post("/api/vacinas/", {"titulo": "Inválida", **dados}, format="json")
                self.assertEqual(response.status_code, 400)
        self.assertEqual(Vacina.objects.count(), 1)

    def test_agenda_unica_ja_exibe_paciente_vacina_e_situacao_inicial(self):
        response = self.agendar(situacao="Realizado", data_situacao="2020-01-01", dose=100)
        self.assertEqual(response.status_code, 201)
        self.assertEqual(len(response.data), 1)
        agenda = response.data[0]
        self.assertEqual(agenda["dose"], 1)
        self.assertEqual(agenda["situacao"], "Agendado")
        self.assertIsNone(agenda["data_situacao"])
        self.assertEqual(agenda["usuario_nome"], self.usuario.nome)
        self.assertEqual(agenda["vacina_titulo"], self.vacina.titulo)
        self.assertEqual(agenda["observacoes"], "Primeira visita")
        url = f"/api/agendas/{agenda['id']}/"
        self.assertEqual(self.client.get(url).status_code, 200)
        self.assertEqual(len(self.client.get("/api/agendas/").data), 1)
        self.assertEqual(self.client.delete(url).status_code, 204)
        self.assertFalse(Agenda.objects.exists())

    def test_gera_doses_em_dias_semanas_meses_e_anos(self):
        casos = [
            (1, 2, "2026-01-10", ["2026-01-10", "2026-01-12", "2026-01-14"]),
            (2, 2, "2026-01-10", ["2026-01-10", "2026-01-24", "2026-02-07"]),
            (3, 1, "2028-01-31", ["2028-01-31", "2028-02-29", "2028-03-31"]),
            (4, 1, "2028-02-29", ["2028-02-29", "2029-02-28", "2030-02-28"]),
        ]
        for periodicidade, intervalo, inicio, esperadas in casos:
            with self.subTest(periodicidade=periodicidade):
                self.vacina.doses = 3
                self.vacina.periodicidade = periodicidade
                self.vacina.intervalo = intervalo
                self.vacina.save()
                response = self.agendar(data=inicio)
                self.assertEqual(response.status_code, 201)
                self.assertEqual([a["data"] for a in response.data], esperadas)
                self.assertEqual([a["dose"] for a in response.data], [1, 2, 3])
                self.assertTrue(all(a["hora"] == "09:30:00" for a in response.data))

    def test_exemplo_do_enunciado_cinco_doses_a_cada_tres_anos(self):
        self.vacina.doses = 5
        self.vacina.periodicidade = 4
        self.vacina.intervalo = 3
        self.vacina.save()
        response = self.agendar(data="2026-05-10")
        self.assertEqual(response.status_code, 201)
        self.assertEqual([a["data"] for a in response.data], [
            "2026-05-10", "2029-05-10", "2032-05-10", "2035-05-10", "2038-05-10",
        ])

    def test_falha_em_uma_dose_desfaz_toda_a_criacao(self):
        self.vacina.doses = 2
        self.vacina.periodicidade = 4
        self.vacina.intervalo = 1
        self.vacina.save()
        response = self.agendar(data="9999-12-31")
        self.assertEqual(response.status_code, 400)
        self.assertIn("data", response.data)
        self.assertFalse(Agenda.objects.exists())

    def test_baixa_preenche_data_atual_e_ignora_data_enviada(self):
        for situacao in ["Realizado", "Cancelado"]:
            with self.subTest(situacao=situacao):
                agenda_id = self.agendar().data[0]["id"]
                with patch("vacinacao.services.timezone.localdate", return_value=date(2027, 3, 5)):
                    response = self.client.post(f"/api/agendas/{agenda_id}/baixa/", {
                        "situacao": situacao, "data_situacao": "2000-01-01",
                    }, format="json")
                self.assertEqual(response.status_code, 200)
                self.assertEqual(response.data["situacao"], situacao)
                self.assertEqual(response.data["data_situacao"], "2027-03-05")
                agenda = Agenda.objects.get(pk=agenda_id)
                self.assertEqual(agenda.situacao, situacao)
                self.assertEqual(agenda.data_situacao, date(2027, 3, 5))

    def test_baixa_rejeita_agendado_ou_situacao_invalida(self):
        agenda_id = self.agendar().data[0]["id"]
        for dados in [{}, {"situacao": "Agendado"}, {"situacao": "Outro"}]:
            response = self.client.post(f"/api/agendas/{agenda_id}/baixa/", dados, format="json")
            self.assertEqual(response.status_code, 400)
        agenda = Agenda.objects.get(pk=agenda_id)
        self.assertEqual(agenda.situacao, "Agendado")
        self.assertIsNone(agenda.data_situacao)

    def test_hoje_exclui_outros_dias_e_ordena_por_situacao(self):
        hoje = timezone.localdate()
        for situacao in ["Cancelado", "Realizado", "Agendado"]:
            agenda_id = self.agendar(data=hoje.isoformat()).data[0]["id"]
            if situacao != "Agendado":
                self.client.post(f"/api/agendas/{agenda_id}/baixa/", {"situacao": situacao}, format="json")
        self.agendar(data=(hoje + timedelta(days=1)).isoformat())
        response = self.client.get("/api/agendas/hoje/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual([a["situacao"] for a in response.data], ["Agendado", "Realizado", "Cancelado"])
        self.assertTrue(all(a["data"] == hoje.isoformat() for a in response.data))

    def test_filtra_situacao_data_e_usuario(self):
        agendada = self.agendar().data[0]
        realizada = self.agendar().data[0]
        cancelada = self.agendar(data="2026-11-03").data[0]
        self.client.post(f"/api/agendas/{realizada['id']}/baixa/", {"situacao": "Realizado"}, format="json")
        self.client.post(f"/api/agendas/{cancelada['id']}/baixa/", {"situacao": "Cancelado"}, format="json")
        for situacao, agenda_id in [
            ("Agendado", agendada["id"]), ("Realizado", realizada["id"]), ("Cancelado", cancelada["id"]),
        ]:
            response = self.client.get("/api/agendas/", {"situacao": situacao})
            self.assertEqual([a["id"] for a in response.data], [agenda_id])
        response = self.client.get("/api/agendas/", {
            "data": "2026-11-02", "usuario": self.usuario.pk, "situacao": "Realizado",
        })
        self.assertEqual([a["id"] for a in response.data], [realizada["id"]])
        self.assertEqual(self.client.get("/api/agendas/", {"usuario": 999}).data, [])

    def test_filtros_invalidos_retornam_400(self):
        for filtros in [{"data": "erro"}, {"situacao": "Outra"}, {"usuario": "abc"}, {"usuario": 0}]:
            response = self.client.get("/api/agendas/", filtros)
            self.assertEqual(response.status_code, 400)

    def test_agendamentos_do_usuario_nao_exibem_outros_pacientes(self):
        minha_agenda = self.agendar().data[0]
        outro = Usuario.objects.create(
            nome="João", data_nascimento=date(1990, 1, 1), sexo="M", logradouro="Rua B",
            numero=20, setor="Centro", cidade="Goiânia", uf="GO",
        )
        self.agendar(usuario=outro.pk)
        response = self.client.get("/api/agendas/", {"usuario": self.usuario.pk})
        self.assertEqual(response.status_code, 200)
        self.assertEqual([a["id"] for a in response.data], [minha_agenda["id"]])
        for campo in ["data", "situacao", "vacina", "dose"]:
            self.assertIn(campo, response.data[0])

    def test_excluir_usuario_apaga_agendas_e_preserva_vacina_e_alergia(self):
        alergia = Alergia.objects.create(nome="Ovo")
        self.usuario.alergias.add(alergia)
        self.agendar()
        response = self.client.delete(f"/api/usuarios/{self.usuario.pk}/")
        self.assertEqual(response.status_code, 204)
        self.assertFalse(Agenda.objects.exists())
        self.assertTrue(Vacina.objects.filter(pk=self.vacina.pk).exists())
        self.assertTrue(Alergia.objects.filter(pk=alergia.pk).exists())

    def test_excluir_vacina_apaga_agendas_e_preserva_usuario(self):
        self.agendar()
        response = self.client.delete(f"/api/vacinas/{self.vacina.pk}/")
        self.assertEqual(response.status_code, 204)
        self.assertFalse(Agenda.objects.exists())
        self.assertTrue(Usuario.objects.filter(pk=self.usuario.pk).exists())

    def test_rejeita_referencias_datas_e_horarios_invalidos(self):
        for dados in [
            {"usuario": 999}, {"vacina": 999}, {"data": "2026-02-30"},
            {"hora": "25:00"}, {"observacoes": "x" * 201},
        ]:
            response = self.agendar(**dados)
            self.assertEqual(response.status_code, 400)
        self.assertFalse(Agenda.objects.exists())

    def test_alteracao_opcional_nao_esta_habilitada(self):
        response = self.client.patch(f"/api/vacinas/{self.vacina.pk}/", {"doses": 2}, format="json")
        self.assertEqual(response.status_code, 405)

    def test_cors_permite_apenas_origem_configurada(self):
        response = self.client.get("/api/vacinas/", HTTP_ORIGIN="http://localhost:5173")
        self.assertEqual(response["Access-Control-Allow-Origin"], "http://localhost:5173")
        response = self.client.get("/api/vacinas/", HTTP_ORIGIN="https://outra-origem.example")
        self.assertNotIn("Access-Control-Allow-Origin", response)

    def test_consulta_do_dia_nao_permite_criacao(self):
        response = self.client.post("/api/agendas/hoje/", self.dados, format="json")
        self.assertEqual(response.status_code, 405)
        self.assertFalse(Agenda.objects.exists())

    def test_rota_de_baixa_exige_post_e_agenda_existente(self):
        agenda_id = self.agendar().data[0]["id"]
        url = f"/api/agendas/{agenda_id}/baixa/"
        self.assertEqual(self.client.get(url).status_code, 405)
        response = self.client.post("/api/agendas/999/baixa/", {"situacao": "Realizado"}, format="json")
        self.assertEqual(response.status_code, 404)

    def test_consultas_e_exclusoes_inexistentes_retornam_404(self):
        for url in ["/api/agendas/999/", "/api/vacinas/999/", "/api/usuarios/999/", "/api/alergias/999/"]:
            with self.subTest(url=url):
                self.assertEqual(self.client.get(url).status_code, 404)
                self.assertEqual(self.client.delete(url).status_code, 404)
