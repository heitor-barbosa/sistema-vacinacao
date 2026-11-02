from django.utils import timezone
from rest_framework import serializers

from .models import Alergia, Usuario


class AlergiaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Alergia
        fields = ["id", "nome"]


class UsuarioSerializer(serializers.ModelSerializer):
    alergias_detalhes = AlergiaSerializer(source="alergias", many=True, read_only=True)

    class Meta:
        model = Usuario
        fields = [
            "id", "nome", "data_nascimento", "sexo", "logradouro", "numero",
            "setor", "cidade", "uf", "alergias", "alergias_detalhes",
        ]

    def validate_data_nascimento(self, value):
        if value > timezone.localdate():
            raise serializers.ValidationError("A data de nascimento não pode ser futura.")
        return value
