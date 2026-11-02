from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from vacinacao.serializers import AgendaSerializer

from .models import Alergia, Usuario
from .serializers import AlergiaSerializer, UsuarioSerializer


class AlergiaViewSet(ModelViewSet):
    queryset = Alergia.objects.all()
    serializer_class = AlergiaSerializer
    http_method_names = ["get", "post", "delete", "head", "options"]


class UsuarioViewSet(ModelViewSet):
    queryset = Usuario.objects.prefetch_related("alergias")
    serializer_class = UsuarioSerializer
    http_method_names = ["get", "post", "delete", "head", "options"]

    @action(detail=True, methods=["get"])
    def agendas(self, request, pk=None):
        usuario = self.get_object()
        agendas = usuario.agendas.select_related("usuario", "vacina").order_by("data", "hora", "id")
        return Response(AgendaSerializer(agendas, many=True).data)
