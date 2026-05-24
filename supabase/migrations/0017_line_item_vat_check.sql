alter table invoice_line_items
  add constraint invoice_line_items_vat_rate_check
  check (vat_rate in (0, 6, 12, 25));
