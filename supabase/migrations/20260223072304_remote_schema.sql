drop extension if exists "pg_net";

drop policy "Public can view business availability" on "public"."availability";

drop policy "Public can view active businesses" on "public"."businesses";

drop policy "Public can view active rewards" on "public"."rewards";

drop policy "Public can view active services" on "public"."services";

alter table "public"."service_addons" drop constraint "service_addons_price_type_check";

alter table "public"."service_questions" drop constraint "service_questions_question_type_check";

alter table "public"."services" drop constraint "services_pricing_type_check";

alter table "public"."service_addons" add constraint "service_addons_price_type_check" CHECK (((price_type)::text = ANY ((ARRAY['fixed'::character varying, 'per_day'::character varying, 'per_person'::character varying])::text[]))) not valid;

alter table "public"."service_addons" validate constraint "service_addons_price_type_check";

alter table "public"."service_questions" add constraint "service_questions_question_type_check" CHECK (((question_type)::text = ANY ((ARRAY['text'::character varying, 'select'::character varying, 'checkbox'::character varying, 'number'::character varying])::text[]))) not valid;

alter table "public"."service_questions" validate constraint "service_questions_question_type_check";

alter table "public"."services" add constraint "services_pricing_type_check" CHECK (((pricing_type)::text = ANY ((ARRAY['fixed'::character varying, 'per_hour'::character varying, 'per_session'::character varying, 'per_night'::character varying, 'starting_at'::character varying])::text[]))) not valid;

alter table "public"."services" validate constraint "services_pricing_type_check";


  create policy "Public can view business availability"
  on "public"."availability"
  as permissive
  for select
  to anon, authenticated
using (((branch_id IS NULL) AND (staff_id IS NULL) AND (EXISTS ( SELECT 1
   FROM public.businesses
  WHERE ((businesses.id = availability.business_id) AND (businesses.subscription_status = ANY (ARRAY['active'::public.subscription_status, 'trialing'::public.subscription_status])))))));



  create policy "Public can view active businesses"
  on "public"."businesses"
  as permissive
  for select
  to anon, authenticated
using ((subscription_status = ANY (ARRAY['active'::public.subscription_status, 'trialing'::public.subscription_status])));



  create policy "Public can view active rewards"
  on "public"."rewards"
  as permissive
  for select
  to anon, authenticated
using (((is_active = true) AND (is_visible = true) AND ((stock IS NULL) OR (stock > 0)) AND (EXISTS ( SELECT 1
   FROM public.businesses
  WHERE ((businesses.id = rewards.business_id) AND (businesses.subscription_status = ANY (ARRAY['active'::public.subscription_status, 'trialing'::public.subscription_status])))))));



  create policy "Public can view active services"
  on "public"."services"
  as permissive
  for select
  to anon, authenticated
using (((is_active = true) AND (EXISTS ( SELECT 1
   FROM public.businesses
  WHERE ((businesses.id = services.business_id) AND (businesses.subscription_status = ANY (ARRAY['active'::public.subscription_status, 'trialing'::public.subscription_status])))))));


CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


  create policy "Allow authenticated uploads"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check ((bucket_id = 'products'::text));



  create policy "Allow public read"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'products'::text));



  create policy "allow_logo_updates"
  on "storage"."objects"
  as permissive
  for update
  to authenticated
using ((bucket_id = 'logos'::text));



  create policy "allow_logo_uploads"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check ((bucket_id = 'logos'::text));



  create policy "allow_public_view_logos"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'logos'::text));



  create policy "allow_public_view_reward_images"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'reward-images'::text));



  create policy "allow_reward_image_deletes"
  on "storage"."objects"
  as permissive
  for delete
  to authenticated
using ((bucket_id = 'reward-images'::text));



  create policy "allow_reward_image_updates"
  on "storage"."objects"
  as permissive
  for update
  to authenticated
using ((bucket_id = 'reward-images'::text));



  create policy "allow_reward_image_uploads"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check ((bucket_id = 'reward-images'::text));



