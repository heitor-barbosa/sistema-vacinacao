from rest_framework.routers import SimpleRouter

from .views import AlergiaViewSet, UsuarioViewSet

router = SimpleRouter()
router.register("alergias", AlergiaViewSet)
router.register("usuarios", UsuarioViewSet)
urlpatterns = router.urls
