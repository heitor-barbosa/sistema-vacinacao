from django.core.validators import MinValueValidator
from django.db import models
from django.db.models import Q


class Vacina(models.Model):
    class Periodicidade(models.IntegerChoices):
        DIAS = 1, "Dias"
        SEMANAS = 2, "Semanas"
        MESES = 3, "Meses"
        ANOS = 4, "Anos"

    titulo = models.CharField(max_length=60)
    descricao = models.CharField(max_length=200, blank=True)
    doses = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    periodicidade = models.IntegerField(choices=Periodicidade.choices, null=True, blank=True)
    intervalo = models.PositiveIntegerField(null=True, blank=True, validators=[MinValueValidator(1)])

    class Meta:
        db_table = "vacinas"
        ordering = ["titulo", "id"]
        constraints = [
            models.CheckConstraint(condition=Q(doses__gte=1), name="vacina_doses_positivas"),
            models.CheckConstraint(
                condition=Q(doses=1) | (
                    Q(periodicidade__isnull=False, periodicidade__in=[1, 2, 3, 4])
                    & Q(intervalo__isnull=False, intervalo__gte=1)
                ),
                name="vacina_intervalo_multiplas_doses",
            ),
        ]

    def __str__(self):
        return self.titulo


class Agenda(models.Model):
    class Situacao(models.TextChoices):
        AGENDADO = "Agendado", "Agendado"
        REALIZADO = "Realizado", "Realizado"
        CANCELADO = "Cancelado", "Cancelado"

    usuario = models.ForeignKey("usuarios.Usuario", on_delete=models.CASCADE, related_name="agendas")
    vacina = models.ForeignKey(Vacina, on_delete=models.CASCADE, related_name="agendas")
    data = models.DateField()
    hora = models.TimeField()
    dose = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    situacao = models.CharField(max_length=10, choices=Situacao.choices, default=Situacao.AGENDADO)
    data_situacao = models.DateField(null=True, blank=True)
    observacoes = models.CharField(max_length=200, blank=True)

    class Meta:
        db_table = "agendas"
        ordering = ["data", "hora", "id"]
        constraints = [
            models.CheckConstraint(condition=Q(dose__gte=1), name="agenda_dose_positiva"),
            models.CheckConstraint(
                condition=(Q(situacao="Agendado", data_situacao__isnull=True)
                    | Q(situacao__in=["Realizado", "Cancelado"], data_situacao__isnull=False)),
                name="agenda_situacao_data_coerentes",
            ),
        ]
