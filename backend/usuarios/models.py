from django.db import models


class Alergia(models.Model):
    nome = models.CharField(max_length=40)

    class Meta:
        db_table = "alergias"
        ordering = ["nome", "id"]

    def __str__(self):
        return self.nome


class Usuario(models.Model):
    class Sexo(models.TextChoices):
        MASCULINO = "M", "Masculino"
        FEMININO = "F", "Feminino"

    UFS = [(uf, uf) for uf in (
        "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
        "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
        "RS", "RO", "RR", "SC", "SP", "SE", "TO",
    )]

    nome = models.CharField(max_length=60)
    data_nascimento = models.DateField()
    sexo = models.CharField(max_length=1, choices=Sexo.choices)
    logradouro = models.CharField(max_length=60)
    numero = models.DecimalField(max_digits=10, decimal_places=0)
    setor = models.CharField(max_length=40)
    cidade = models.CharField(max_length=40)
    uf = models.CharField(max_length=2, choices=UFS)
    alergias = models.ManyToManyField(
        Alergia, blank=True, related_name="usuarios", db_table="usuarios_alergias"
    )

    class Meta:
        db_table = "usuarios"
        ordering = ["nome", "id"]

    def __str__(self):
        return self.nome
