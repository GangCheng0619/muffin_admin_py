"""Peewee ORM Support."""

import typing as t


import peewee as pw
import marshmallow as ma
from muffin_rest.peewee import PWRESTBase, PWRESTOptions, PWFilter, Filter

from ..handler import AdminHandler, AdminOptions
from ..typing import RA_INFO


class PWAdminOptions(AdminOptions, PWRESTOptions):

    """Keep PWAdmin options."""

    def setup(self, cls):
        """Auto insert filter by id."""
        super(PWAdminOptions, self).setup(cls)

        for f in self.filters:
            if isinstance(f, Filter):
                f = f.name

            if f == 'id':
                break

        else:
            self.filters = [PWFilter('id', pw_field=self.model_pk), *self.filters]


class PWAdminHandler(AdminHandler, PWRESTBase):

    """Work with Peewee Models."""

    meta_class: t.Type[PWAdminOptions] = PWAdminOptions
    meta: PWAdminOptions

    class Meta:

        """Mark the class as abc base."""

        abc = True

    @classmethod
    def to_ra_input(cls, field: ma.fields.Field, name: str) -> t.Optional[RA_INFO]:
        """Convert self schema field to ra field."""
        res = super(PWAdminHandler, cls).to_ra_input(field, name)
        if res:
            mfield = getattr(cls.meta.model, field.attribute or name, None)
            if mfield and mfield.choices:
                rtype, props = res
                return 'SelectInput', dict(props, choices=[
                    {"id": c[0], "name": c[1]} for c in mfield.choices
                ])

        return res


class PWSearchFilter(PWFilter):

    """Search in query by value."""

    def query(self, query: pw.Query, column: pw.Field, *ops: t.Tuple, **kwargs) -> pw.Query:
        """Apply the filters to Peewee QuerySet.."""
        _, value = ops[0]
        return query.where(column.contains(value))
