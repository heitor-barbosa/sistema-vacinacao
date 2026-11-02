from datetime import timedelta

from django.utils import timezone
from rest_framework.test import APITestCase

from .models import Alergia, Usuario


class UsuariosAPITests(APITestCase):
    def setUp(self):
        self.dados = {
            "nome": "Maria", "data_nascimento": "2000-05-20", "sexo": "F",
            "logradouro": "Rua A", "numero": 10, "setor": "Centro",
            "cidade": "Goiânia", "uf": "GO",
        }

    def test_cadastra_consulta_e_exclui_usuario_sem_alergias(self):
        response = self.client.post("/api/usuarios/", self.dados, format="json")
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["alergias"], [])
        url = f"/api/usuarios/{response.data['id']}/"
        self.assertEqual(self.client.get(url).data["nome"], "Maria")
        self.assertEqual(len(self.client.get("/api/usuarios/").data), 1)
        self.assertEqual(self.client.delete(url).status_code, 204)
        self.assertFalse(Usuario.objects.exists())

    def test_usuario_pode_ter_varias_alergias(self):
        alergias = [Alergia.objects.create(nome=nome) for nome in ["Látex", "Ovo"]]
        response = self.client.post(
            "/api/usuarios/", {**self.dados, "alergias": [a.pk for a in alergias]},
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(len(response.data["alergias_detalhes"]), 2)

    def test_rejeita_sexo_uf_data_futura_e_alergia_inexistente(self):
        for campo, valor in [
            ("sexo", "X"), ("uf", "XX"), ("alergias", [999]),
            ("data_nascimento", (timezone.localdate() + timedelta(days=1)).isoformat()),
        ]:
            with self.subTest(campo=campo):
                response = self.client.post(
                    "/api/usuarios/", {**self.dados, campo: valor}, format="json"
                )
                self.assertEqual(response.status_code, 400)
                self.assertIn(campo, response.data)
        self.assertFalse(Usuario.objects.exists())

    def test_excluir_alergia_remove_apenas_associacao(self):
        response = self.client.post("/api/alergias/", {"nome": "Ovo"}, format="json")
        self.assertEqual(response.status_code, 201)
        alergia_id = response.data["id"]
        user = self.client.post(
            "/api/usuarios/", {**self.dados, "alergias": [alergia_id]}, format="json"
        )
        self.assertEqual(user.status_code, 201)
        self.assertEqual(len(self.client.get("/api/alergias/").data), 1)
        self.assertEqual(self.client.get(f"/api/alergias/{alergia_id}/").status_code, 200)
        self.assertEqual(self.client.delete(f"/api/alergias/{alergia_id}/").status_code, 204)
        self.assertTrue(Usuario.objects.filter(pk=user.data["id"]).exists())
        self.assertEqual(self.client.get(f"/api/usuarios/{user.data['id']}/").data["alergias"], [])
