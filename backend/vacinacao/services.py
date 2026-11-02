from dateutil.relativedelta import relativedelta
from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from .models import Agenda, Vacina


@transaction.atomic
def criar_agendas(*, usuario, vacina, data, hora, observacoes=""):
    unidades = {
        Vacina.Periodicidade.DIAS: "days",
        Vacina.Periodicidade.SEMANAS: "weeks",
        Vacina.Periodicidade.MESES: "months",
        Vacina.Periodicidade.ANOS: "years",
    }
    agendas = []
    for indice in range(vacina.doses):
        data_dose = data
        if indice:
            try:
                data_dose = data + relativedelta(**{
                    unidades[vacina.periodicidade]: indice * vacina.intervalo
                })
            except (ValueError, OverflowError):
                raise ValidationError({"data": "As doses ultrapassam o limite de datas permitido."})
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
