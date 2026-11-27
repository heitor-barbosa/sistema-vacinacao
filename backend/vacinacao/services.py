from dateutil.relativedelta import relativedelta
from django.db import transaction
from django.db.models import Sum
from django.utils import timezone
from rest_framework import status
from rest_framework.exceptions import APIException, ValidationError

from .models import Agenda, Lote, Vacina


class VacinaIndisponivel(APIException):
    status_code = status.HTTP_409_CONFLICT
    default_code = "vacina_indisponivel"


def calcular_estoque(vacina, data):
    # Estoque em lotes: doses dos lotes válidos na data, inclusive no dia da validade (RN03).
    lotes_validos = Lote.objects.filter(vacina=vacina, validade__gte=data)
    estoque_lotes = lotes_validos.aggregate(total=Sum("quantidade"))["total"] or 0

    # Cada agenda Agendado reserva uma dose (RN04); cancelar ou excluir libera a reserva (RN07).
    doses_reservadas = Agenda.objects.filter(vacina=vacina, situacao=Agenda.Situacao.AGENDADO).count()

    # Se lotes vencerem e as reservas passarem do estoque em lotes, o disponível fica em zero (RN04).
    estoque_disponivel = max(estoque_lotes - doses_reservadas, 0)

    return {
        "estoque_lotes": estoque_lotes,
        "doses_reservadas": doses_reservadas,
        "estoque_disponivel": estoque_disponivel,
    }


def calcular_datas_das_doses(vacina, data):
    unidades = {
        Vacina.Periodicidade.DIAS: "days",
        Vacina.Periodicidade.SEMANAS: "weeks",
        Vacina.Periodicidade.MESES: "months",
        Vacina.Periodicidade.ANOS: "years",
    }
    datas = [data]
    for indice in range(1, vacina.doses):
        try:
            datas.append(data + relativedelta(**{
                unidades[vacina.periodicidade]: indice * vacina.intervalo
            }))
        except (ValueError, OverflowError):
            raise ValidationError({"data": "As doses ultrapassam o limite de datas permitido."})
    return datas


@transaction.atomic
def criar_agendas(*, usuario, vacina, data, hora, observacoes=""):
    datas = calcular_datas_das_doses(vacina, data)

    # Bloqueia os lotes da vacina até o fim da transação. Assim, agendamentos simultâneos
    # da mesma vacina são feitos um de cada vez e não reservam as mesmas doses.
    list(Lote.objects.select_for_update().filter(vacina=vacina))

    # O estoque disponível na data da primeira dose precisa cobrir todas as doses (RN05, D14 e D24).
    estoque = calcular_estoque(vacina, data)
    if estoque["estoque_disponivel"] < len(datas):
        raise VacinaIndisponivel(
            f"Vacina indisponível: não há doses suficientes da vacina {vacina.titulo} em estoque. "
            "O agendamento não foi realizado."
        )

    agendas = []
    for indice, data_dose in enumerate(datas):
        agendas.append(Agenda.objects.create(
            usuario=usuario, vacina=vacina, data=data_dose, hora=hora,
            dose=indice + 1, observacoes=observacoes,
        ))
    return agendas


def dar_baixa(agenda, situacao):
    agenda.situacao = situacao
    agenda.data_situacao = timezone.localdate()
    agenda.save(update_fields=["situacao", "data_situacao"])
    return agenda
