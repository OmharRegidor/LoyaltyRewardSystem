alter table "public"."service_addons" drop constraint "service_addons_price_type_check";

alter table "public"."service_questions" drop constraint "service_questions_question_type_check";

alter table "public"."services" drop constraint "services_pricing_type_check";

alter table "public"."service_addons" add constraint "service_addons_price_type_check" CHECK (((price_type)::text = ANY ((ARRAY['fixed'::character varying, 'per_day'::character varying, 'per_person'::character varying])::text[]))) not valid;

alter table "public"."service_addons" validate constraint "service_addons_price_type_check";

alter table "public"."service_questions" add constraint "service_questions_question_type_check" CHECK (((question_type)::text = ANY ((ARRAY['text'::character varying, 'select'::character varying, 'checkbox'::character varying, 'number'::character varying])::text[]))) not valid;

alter table "public"."service_questions" validate constraint "service_questions_question_type_check";

alter table "public"."services" add constraint "services_pricing_type_check" CHECK (((pricing_type)::text = ANY ((ARRAY['fixed'::character varying, 'per_hour'::character varying, 'per_session'::character varying, 'per_night'::character varying, 'starting_at'::character varying])::text[]))) not valid;

alter table "public"."services" validate constraint "services_pricing_type_check";


