from django import template
from django.template import Context
from django.core.exceptions import ObjectDoesNotExist
from django.template.loader import get_template
from ..models import TooltipMessage
from ..settings import STATIC_URL

register = template.Library()


def render_tooltip(tooltip_id):
    try:
        context = Context({
            "message": TooltipMessage.objects.get(pk=tooltip_id).content,
            "icon_url": STATIC_URL + "images/tooltip-icon.png"}
        )
        return get_template("tooltip.html").render(context)
    except ObjectDoesNotExist:
        return ""


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
        return render_tooltip(self.tooltip_id)


@register.tag
def field_tooltip(parser, token):
    try:
        tag_name, field = token.split_contents()
    except ValueError:
        raise template.TemplateSyntaxError("%r tag requires a single argument" % token.contents.split()[0])
    return TooltipFieldNode(field)


class TooltipFieldNode(template.Node):
    def __init__(self, field):
        self.field = field

    def render(self, context):
        try:
            return render_tooltip(context[self.field].id_for_label)
        except KeyError:
            return ""