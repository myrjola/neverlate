from django import template
from django.core.exceptions import ObjectDoesNotExist
from ..models import TooltipMessage

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
        # TODO: write some html
        try:
            message = TooltipMessage.objects.get(pk=self.tooltip_id).content
        except ObjectDoesNotExist:
            message = ""
        return message
