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

    UFS = [
        ("AC", "AC"), ("AL", "AL"), ("AP", "AP"),
        ("AM", "AM"), ("BA", "BA"), ("CE", "CE"),
        ("DF", "DF"), ("ES", "ES"), ("GO", "GO"),
        ("MA", "MA"), ("MT", "MT"), ("MS", "MS"),
        ("MG", "MG"), ("PA", "PA"), ("PB", "PB"),
        ("PR", "PR"), ("PE", "PE"), ("PI", "PI"),
        ("RJ", "RJ"), ("RN", "RN"), ("RS", "RS"),
        ("RO", "RO"), ("RR", "RR"), ("SC", "SC"),
        ("SP", "SP"), ("SE", "SE"), ("TO", "TO"),
    ]

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
