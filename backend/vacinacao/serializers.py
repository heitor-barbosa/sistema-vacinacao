from datetime import timedelta

from django.utils import timezone
from rest_framework import serializers
from rest_framework.validators import UniqueTogetherValidator

from .models import Agenda, Lote, Vacina
from .services import calcular_estoque

# Prazo fixo nesta etapa para classificar um lote como "Vence em breve" (RN20).
DIAS_VENCE_EM_BREVE = 30


class VacinaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vacina
        fields = ["id", "titulo", "descricao", "doses", "periodicidade", "intervalo"]

    def to_representation(self, vacina):
        # Acrescenta à resposta, somente para leitura, o estoque calculado para a data atual (A05).
        dados = super().to_representation(vacina)
        dados.update(calcular_estoque(vacina, timezone.localdate()))
        return dados

    def validate(self, attrs):
        if attrs["doses"] > 1:
            errors = {}
            for field in ["periodicidade", "intervalo"]:
                if attrs.get(field) is None:
                    errors[field] = "Obrigatório para vacinas com mais de uma dose."
            if errors:
                raise serializers.ValidationError(errors)
        return attrs


class LoteSerializer(serializers.ModelSerializer):
    vacina_titulo = serializers.CharField(source="vacina.titulo", read_only=True)
    situacao_validade = serializers.SerializerMethodField()

    class Meta:
        model = Lote
        fields = [
            "id", "vacina", "vacina_titulo", "numero", "fabricante",
            "validade", "quantidade", "situacao_validade",
        ]
        # Substitui a mensagem genérica do DRF para a restrição de número único por vacina (RN02).
        validators = [
            UniqueTogetherValidator(
                queryset=Lote.objects.all(),
                fields=["vacina", "numero"],
                message="Já existe um lote com este número para a vacina.",
            ),
        ]

    def get_situacao_validade(self, lote):
        hoje = timezone.localdate()
        limite_vence_em_breve = hoje + timedelta(days=DIAS_VENCE_EM_BREVE)

        # O lote pode ser usado até a data de validade, inclusive (RN03).
        if lote.validade < hoje:
            return "Vencido"
        if lote.validade <= limite_vence_em_breve:
            return "Vence em breve"
        return "Valido"


class LoteFiltroSerializer(serializers.Serializer):
    vacina = serializers.IntegerField(required=False, min_value=1)


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
