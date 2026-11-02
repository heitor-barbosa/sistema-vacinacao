from rest_framework.viewsets import ModelViewSet

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
