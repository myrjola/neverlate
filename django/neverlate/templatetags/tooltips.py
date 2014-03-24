from django import template
from django.core.exceptions import ObjectDoesNotExist
from ..models import TooltipMessage
from ..settings import STATIC_URL

register = template.Library()


@register.tag
def tooltip(parser, token):
    try:
        tag_name, tooltip_id = token.split_contents()
    except ValueError:
        raise template.TemplateSyntaxError("%r tag requires a single argument" % token.contents.split()[0])
    return TooltipNode(tooltip_id)


class TooltipNode(template.Node):
    def __init__(self, tooltip_id):
        self.tooltip_id = tooltip_id

    def render(self, context):
        try:
            message = \
                "<i rel=\"tooltip\" title=\"" + \
                TooltipMessage.objects.get(pk=self.tooltip_id).content + \
                "\"><img src=\"" + STATIC_URL + "images/tooltip-icon.png\" alt=\"tooltip\"></i>" \
                "<script type=\"text/javascript\">" \
                "jQuery(function(){" \
                "$(\"[rel=tooltip]\").tooltip({ html: 'true', trigger: 'click hover'});" \
                "});" \
                "</script>"

        except ObjectDoesNotExist:
            message = ""
        return message
