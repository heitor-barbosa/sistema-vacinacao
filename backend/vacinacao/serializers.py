from rest_framework import serializers

from .models import Agenda, Vacina


class VacinaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vacina
        fields = ["id", "titulo", "descricao", "doses", "periodicidade", "intervalo"]

    def validate(self, attrs):
        if attrs["doses"] > 1:
            errors = {}
            for field in ["periodicidade", "intervalo"]:
                if attrs.get(field) is None:
                    errors[field] = "Obrigatório para vacinas com mais de uma dose."
            if errors:
                raise serializers.ValidationError(errors)
        return attrs


class AgendaSerializer(serializers.ModelSerializer):
    usuario_nome = serializers.CharField(source="usuario.nome", read_only=True)
    vacina_titulo = serializers.CharField(source="vacina.titulo", read_only=True)

    class Meta:
        model = Agenda
        fields = [
            "id", "usuario", "usuario_nome", "vacina", "vacina_titulo", "data",
            "hora", "dose", "situacao", "data_situacao", "observacoes",
        ]
        read_only_fields = ["dose", "situacao", "data_situacao"]


class BaixaSerializer(serializers.Serializer):
    situacao = serializers.ChoiceField(choices=[Agenda.Situacao.REALIZADO, Agenda.Situacao.CANCELADO])


class AgendaFiltroSerializer(serializers.Serializer):
    data = serializers.DateField(required=False, input_formats=["%Y-%m-%d"])
    situacao = serializers.ChoiceField(choices=Agenda.Situacao.choices, required=False)
    usuario = serializers.IntegerField(required=False, min_value=1)
