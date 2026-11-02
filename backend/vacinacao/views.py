from django.db.models import Case, IntegerField, Value, When
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from .models import Agenda, Vacina
from .serializers import AgendaFiltroSerializer, AgendaSerializer, BaixaSerializer, VacinaSerializer
from .services import criar_agendas, dar_baixa


class VacinaViewSet(ModelViewSet):
    queryset = Vacina.objects.all()
    serializer_class = VacinaSerializer
    http_method_names = ["get", "post", "delete", "head", "options"]


class AgendaViewSet(ModelViewSet):
    queryset = Agenda.objects.select_related("usuario", "vacina")
    serializer_class = AgendaSerializer
    http_method_names = ["get", "post", "delete", "head", "options"]

    def get_queryset(self):
        filtros = AgendaFiltroSerializer(data=self.request.query_params)
        filtros.is_valid(raise_exception=True)
        return super().get_queryset().filter(**filtros.validated_data).order_by(
            Case(
                When(situacao=Agenda.Situacao.AGENDADO, then=Value(0)),
                When(situacao=Agenda.Situacao.REALIZADO, then=Value(1)),
                default=Value(2), output_field=IntegerField(),
            ),
            "data", "hora", "id",
        )

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        agendas = criar_agendas(**serializer.validated_data)
        return Response(self.get_serializer(agendas, many=True).data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=["get"])
    def hoje(self, request):
        agendas = self.get_queryset().filter(data=timezone.localdate())
        return Response(self.get_serializer(agendas, many=True).data)

    @action(detail=True, methods=["post"])
    def baixa(self, request, pk=None):
        agenda = self.get_object()
        serializer = BaixaSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        agenda = dar_baixa(agenda, serializer.validated_data["situacao"])
        return Response(self.get_serializer(agenda).data)
