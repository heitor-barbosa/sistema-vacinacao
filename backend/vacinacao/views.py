from django.db.models import Case, IntegerField, RestrictedError, When
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from .models import Agenda, Lote, Vacina
from .serializers import (
    AgendaFiltroSerializer,
    AgendaSerializer,
    BaixaSerializer,
    LoteFiltroSerializer,
    LoteSerializer,
    VacinaSerializer,
)
from .services import criar_agendas, dar_baixa


def get_agendas_queryset(parametros):
    serializer = AgendaFiltroSerializer(data=parametros)
    serializer.is_valid(raise_exception=True)
    filtros = serializer.validated_data

    agendas = Agenda.objects.select_related("usuario", "vacina")

    if "data" in filtros:
        agendas = agendas.filter(data=filtros["data"])

    if "situacao" in filtros:
        agendas = agendas.filter(situacao=filtros["situacao"])

    if "usuario" in filtros:
        agendas = agendas.filter(usuario=filtros["usuario"])

    # A prioridade garante a ordem exigida: Agendado, Realizado e Cancelado.
    ordem_situacao = Case(
        When(situacao=Agenda.Situacao.AGENDADO, then=0),
        When(situacao=Agenda.Situacao.REALIZADO, then=1),
        default=2,
        output_field=IntegerField(),
    )
    agendas = agendas.order_by(ordem_situacao, "data", "hora", "id")

    return agendas


class VacinaListCreateAPIView(generics.ListCreateAPIView):
    queryset = Vacina.objects.all()
    serializer_class = VacinaSerializer


class VacinaDetailAPIView(generics.RetrieveDestroyAPIView):
    queryset = Vacina.objects.all()
    serializer_class = VacinaSerializer


class LoteListCreateAPIView(generics.ListCreateAPIView):
    serializer_class = LoteSerializer

    def get_queryset(self):
        serializer = LoteFiltroSerializer(data=self.request.query_params)
        serializer.is_valid(raise_exception=True)
        filtros = serializer.validated_data

        lotes = Lote.objects.select_related("vacina")

        if "vacina" in filtros:
            lotes = lotes.filter(vacina=filtros["vacina"])

        return lotes


class LoteDetailAPIView(generics.RetrieveDestroyAPIView):
    queryset = Lote.objects.select_related("vacina")
    serializer_class = LoteSerializer

    def perform_destroy(self, instance):
        # Um lote já usado em uma aplicação não pode ser excluído (RN08).
        try:
            instance.delete()
        except RestrictedError:
            raise ValidationError({"detail": "O lote já foi utilizado em uma aplicação e não pode ser excluído."})


class AgendaListCreateAPIView(generics.ListCreateAPIView):
    serializer_class = AgendaSerializer

    def get_queryset(self):
        return get_agendas_queryset(self.request.query_params)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        agendas = criar_agendas(**serializer.validated_data)
        resposta = self.get_serializer(agendas, many=True)

        return Response(
            resposta.data,
            status=status.HTTP_201_CREATED,
        )


class AgendaDetailAPIView(generics.RetrieveDestroyAPIView):
    queryset = Agenda.objects.select_related("usuario", "vacina")
    serializer_class = AgendaSerializer


class AgendaHojeAPIView(generics.ListAPIView):
    serializer_class = AgendaSerializer

    def get_queryset(self):
        agendas = get_agendas_queryset(self.request.query_params)
        hoje = timezone.localdate()
        agendas = agendas.filter(data=hoje)

        return agendas


class AgendaBaixaAPIView(generics.GenericAPIView):
    queryset = Agenda.objects.select_related("usuario", "vacina")
    serializer_class = BaixaSerializer

    def post(self, request, *args, **kwargs):
        agenda = self.get_object()
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        situacao = serializer.validated_data["situacao"]
        agenda = dar_baixa(agenda, situacao)
        resposta = AgendaSerializer(agenda, context=self.get_serializer_context())

        return Response(resposta.data)
