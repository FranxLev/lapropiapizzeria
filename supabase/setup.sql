-- Proyecto de demostración La Propia Pizzería · Supabase/Postgres
-- Ejecutar en SQL Editor de un proyecto NUEVO de Supabase.
-- Los datos públicos iniciales proceden de un listado de Rappi y deben verificarse.
-- Nunca usar service_role en frontend.

create extension if not exists pgcrypto;
create table if not exists public.admin_users(
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
create table if not exists public.products(
  id text primary key,
  category text not null,
  name text not null,
  price numeric(12,0) not null check(price>=0),
  description text not null default '',
  image_url text not null default '',
  available boolean not null default true,
  featured boolean not null default false,
  badge text not null default '',
  sort_order integer not null default 0,
  updated_at timestamptz not null default now()
);
create table if not exists public.promotions(
  id text primary key,
  title text not null,
  description text not null default '',
  active boolean not null default false,
  sort_order integer not null default 0
);
create table if not exists public.site_settings(
  key text primary key,
  value jsonb not null default '{}'::jsonb
);
create or replace function public.is_site_admin() returns boolean
language sql security definer stable set search_path=public as $$
  select exists(select 1 from public.admin_users where user_id=(select auth.uid()));
$$;
revoke all on function public.is_site_admin() from public;
grant execute on function public.is_site_admin() to anon,authenticated;
alter table public.admin_users enable row level security;
alter table public.products enable row level security;
alter table public.promotions enable row level security;
alter table public.site_settings enable row level security;

drop policy if exists admin_read_own on public.admin_users;
create policy admin_read_own on public.admin_users for select to authenticated using(user_id=(select auth.uid()));
drop policy if exists products_read on public.products;
create policy products_read on public.products for select to anon,authenticated using(available=true OR public.is_site_admin());
drop policy if exists products_insert on public.products;
create policy products_insert on public.products for insert to authenticated with check(public.is_site_admin());
drop policy if exists products_update on public.products;
create policy products_update on public.products for update to authenticated using(public.is_site_admin()) with check(public.is_site_admin());
drop policy if exists products_delete on public.products;
create policy products_delete on public.products for delete to authenticated using(public.is_site_admin());
drop policy if exists promotions_read on public.promotions;
create policy promotions_read on public.promotions for select to anon,authenticated using(active=true OR public.is_site_admin());
drop policy if exists promotions_manage_insert on public.promotions;
create policy promotions_manage_insert on public.promotions for insert to authenticated with check(public.is_site_admin());
drop policy if exists promotions_manage_update on public.promotions;
create policy promotions_manage_update on public.promotions for update to authenticated using(public.is_site_admin()) with check(public.is_site_admin());
drop policy if exists promotions_manage_delete on public.promotions;
create policy promotions_manage_delete on public.promotions for delete to authenticated using(public.is_site_admin());
drop policy if exists settings_read on public.site_settings;
create policy settings_read on public.site_settings for select to anon,authenticated using(key='site' OR public.is_site_admin());
drop policy if exists settings_insert on public.site_settings;
create policy settings_insert on public.site_settings for insert to authenticated with check(public.is_site_admin());
drop policy if exists settings_update on public.site_settings;
create policy settings_update on public.site_settings for update to authenticated using(public.is_site_admin()) with check(public.is_site_admin());

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('menu-images','menu-images',true,4194304,array['image/jpeg','image/png','image/webp'])
on conflict(id) do update set public=true,file_size_limit=4194304,allowed_mime_types=excluded.allowed_mime_types;
drop policy if exists menu_images_public_read on storage.objects;
create policy menu_images_public_read on storage.objects for select to anon,authenticated using(bucket_id='menu-images');
drop policy if exists menu_images_admin_insert on storage.objects;
create policy menu_images_admin_insert on storage.objects for insert to authenticated with check(bucket_id='menu-images' and public.is_site_admin());
drop policy if exists menu_images_admin_update on storage.objects;
create policy menu_images_admin_update on storage.objects for update to authenticated using(bucket_id='menu-images' and public.is_site_admin()) with check(bucket_id='menu-images' and public.is_site_admin());
drop policy if exists menu_images_admin_delete on storage.objects;
create policy menu_images_admin_delete on storage.objects for delete to authenticated using(bucket_id='menu-images' and public.is_site_admin());

-- Semilla: conserva lo que el administrador ya haya editado si ejecutas de nuevo.
insert into public.products(id,category,name,price,description,image_url,available,featured,badge,sort_order) values
('cacerola-de-burrata','Entradas','Cacerola de Burrata',28000,'Tomates cherry confitados, albahaca fresca y burrata con reducción de balsámico anisado; acompañada con pan pizza.','https://images.rappi.com/products/a03d21ce-705b-49c8-a0b5-58aefe0bb087-1729885410954.png?d=700x700&e=webp&q=80',true,false,'',1),
('cacerola-de-champis','Entradas','Cacerola de Champis',20000,'Champiñones horneados con mozzarella, albahaca y parmesano; acompañados con pan pizza.','',true,false,'',2),
('cacerola-de-tocineta','Entradas','Cacerola de Tocineta',18000,'Maíz, tocineta, dip de albahaca y mozzarella gratinada; acompañada con pan pizza.','',true,false,'',3),
('cacerola-de-chorizo','Entradas','Cacerola de Chorizo',18000,'Chorizo dulce horneado con salsa de naranja; acompañado con pan de pizza.','',true,false,'',4),
('carnuda-recargada','Pizzas recargadas','Carnuda Recargada',45000,'Pizza estofada personal con salsa napolitana, cerdo desmechado en BBQ de tamarindo, pollo, jamón, pepperoni, tocineta y triple mozzarella.','https://images.rappi.com/products/e092258f-716e-410c-a418-86c826659f60.png?d=700x700&e=webp&q=80',true,true,'Recargada',5),
('pollo-recargada','Pizzas recargadas','Pollo Recargada',43000,'Pizza estofada personal con salsa de ajo, triple mozzarella, pollo, maíz, cebolla caramelizada y tocineta.','https://images.rappi.com/products/9585aa16-7cb1-4c15-8af9-ad57c0e42206-1646433988174.png?d=700x700&e=webp&q=80',true,false,'',6),
('miel-peppe-recargada','Pizzas recargadas','Miel Peppe Recargada',41000,'Pizza estofada personal con salsa napolitana, triple mozzarella, pepperoni, queso crema y miel.','',true,false,'',7),
('quesuda-recargada','Pizzas recargadas','Quesuda Recargada',40000,'Pizza estofada personal con salsa napolitana, queso azul, pera caramelizada, queso crema, parmesano y triple mozzarella.','',true,false,'',8),
('hawaiana-recargada','Pizzas recargadas','Hawaiana Recargada',40000,'Pizza estofada personal con salsa napolitana, triple mozzarella, jamón y piña.','',true,false,'',9),
('burrata','Pizzas','Burrata',37000,'Salsa napolitana, mozzarella de búfala, tomates confitados, albahaca fresca y burrata con jalea de tamarindo.','https://images.rappi.com/products/2d044017-d4bf-41b8-b97a-02e8e9ef9a13-1729887003473.png?d=700x700&e=webp&q=80',true,true,'',10),
('carnuda','Pizzas','Carnuda',31000,'Salsa napolitana, mozzarella, pepperoni, tocineta y jamón.','',true,false,'',11),
('quesuda','Pizzas','Quesuda',29000,'Salsa napolitana, mozzarella, queso crema, queso azul, pera caramelizada y parmesano.','',true,false,'',12),
('la-choridelfia','Pizzas','La Choridelfia',29000,'Masa y salsa napolitana, mozzarella de búfala, chorizo artesanal, cebolla roja encurtida, jalea de pimientos, queso crema y rúcula.','',true,false,'',13),
('la-de-uchuva','Pizzas','La de Uchuva',27000,'Salsa de ajo, mozzarella de búfala, uchuva, cebolla caramelizada, queso crema, tocineta y brotes.','',true,false,'',14),
('la-coqueta','Pizzas','La Coqueta',29000,'Masa fermentada 48 horas, salsa napolitana, mozzarella de búfala, cerdo ahumado, queso crema, tocineta y BBQ. Participante Pizza Master 2022.','https://images.rappi.com/products/b29e8f85-22c9-4938-bf4e-07cafd4baf61.png?d=700x700&e=webp&q=80',true,true,'Pizza Master 2022',15),
('la-picara','Pizzas','La Pícara',28000,'Salsa napolitana, mozzarella de búfala, pepperoni, puerro, queso crema, parmesano y albahaca. Miel picante o de hierbas a elección.','',true,false,'',16),
('la-patrona','Pizzas','La Patrona',27000,'Salsa napolitana, mozzarella, tocino ahumado, champiñones en jalea, albahaca, parmesano y chicharrón crocante.','',true,false,'',17),
('la-propia-master','Pizzas','La Propia Master',30000,'Base napolitana, mozzarella de búfala, tocineta, queso crema de albahaca, cherry confitado y reducción de tamarindo con ron.','https://images.rappi.com/products/47155bc8-61d3-4aad-840b-502580de56ed.png?d=700x700&e=webp&q=80',true,true,'De la casa',18),
('don-peppe','Pizzas','Don Peppe',24500,'Pizza artesanal de salsa napolitana, mozzarella y pepperoni.','',true,false,'',19),
('enfiestada','Pizzas','Enfiestada',27000,'Pizza personal de salsa napolitana, mozzarella, tocineta, queso crema, BBQ de tamarindo y notas de ron.','',true,false,'',20),
('dona-margarita','Pizzas','Doña Margarita',21000,'Pizza artesanal de salsa napolitana, mozzarella, albahaca fresca, tomate en rodajas y aceite de oliva.','https://images.rappi.com/products/bae89489-89d7-4f3a-b873-58b31cc13348-1596153045200.jpeg?d=700x700&e=webp&q=80',true,false,'',21),
('cherryneta','Pizzas','Cherryneta',29000,'Salsa napolitana, mozzarella, tocineta, tomate cherry, piña y albahaca.','',true,false,'',22),
('hawaiana','Pizzas','Hawaiana',24500,'Salsa napolitana, mozzarella, jamón y piña caramelizada.','',true,false,'',23),
('champion','Pizzas','Champion',30000,'Salsa de ajo, mozzarella, pollo, champiñones, tocineta y BBQ de tamarindo.','',true,false,'',24),
('salmon-en-mantequilla-de-jengibre','Combinados','Salmón en mantequilla de jengibre',49000,'Filete de salmón en salsa de naranja, mantequilla de jengibre, fettuccini y ensalada.','',true,false,'',25),
('solomito-de-res-en-champinones','Combinados','Solomito de res en champiñones',48000,'Solomito en salsa de champiñones, fettuccini y ensalada de mézclum.','',true,false,'',26),
('pollo-en-jalea-de-uchuvas','Combinados','Pollo en jalea de uchuvas',35000,'Pechuga de pollo en salsa de uchuva dulce, ensalada y pasta a elección.','',true,false,'',27),
('lasana-mixta','Lasañas','Lasaña mixta',39000,'Carne boloñesa, pollo con champiñones, bechamel, mozzarella y parmesano. Con ensalada y pan pizza.','https://images.rappi.com/products/ece90276-b686-4afd-b633-e20170369fd8-1596155428284.jpeg?d=700x700&e=webp&q=80',true,false,'',28),
('canelones-con-carne-y-tocineta','Lasañas','Canelones con carne y tocineta',38000,'Pasta artesanal rellena de carne y tocineta, salsa napolitana, mozzarella de búfala y parmesano.','',true,false,'',29),
('lasana-de-carne-y-maduritos','Lasañas','Lasaña de carne y maduritos',38000,'Carne boloñesa, plátano maduro, tocineta, bechamel, mozzarella y parmesano.','',true,false,'',30),
('lasana-de-pollo-y-salsa-blanca','Lasañas','Lasaña de pollo y salsa blanca',38000,'Pollo, maíz y tocineta, bechamel, mozzarella y parmesano.','',true,false,'',31),
('la-de-tres-quesos-y-trufa','Pastas','La de tres quesos y trufa',47000,'Fettuccini artesanal, salsa de tres quesos y trufa, julianas de solomito, rúcula y ajonjolí negro.','https://images.rappi.com/products/f36be37e-5ed2-4b0c-a76d-b8fd47e92db5-1729886097976.png?d=700x700&e=webp&q=80',true,true,'',32),
('pollo-parmesano','Pastas','Pollo parmesano',40000,'Fettuccini artesanal, salsa cremosa de pesto, tocineta, pollo, parmesano y ajonjolí negro. Con pan.','',true,false,'',33),
('la-de-cerdo','Pastas','La de cerdo',35000,'Fettuccini artesanal, lomito de cerdo, maduritos, tocineta, parmesano y salsa cremosa.','',true,false,'',34),
('la-de-carne-molida','Pastas','La de carne molida',33000,'Fettuccini artesanal, carne boloñesa, parmesano y albahaca. Con pan.','',true,false,'',35),
('pepsi-400-ml','Bebidas','Pepsi 400 ml',5500,'Gaseosa.','',true,false,'',36),
('manzana-400-ml','Bebidas','Manzana 400 ml',5500,'Gaseosa.','',true,false,'',37),
('colombiana-400-ml','Bebidas','Colombiana 400 ml',5500,'Gaseosa.','',true,false,'',38),
('hatsu-blanco-400-ml','Bebidas','Hatsu blanco 400 ml',9500,'Té.','',true,false,'',39),
('hatsu-negro-400-ml','Bebidas','Hatsu negro 400 ml',9500,'Té.','',true,false,'',40),
('hatsu-fucsia-400-ml','Bebidas','Hatsu fucsia 400 ml',9500,'Té.','',true,false,'',41),
('pepsi-1-5-l','Bebidas','Pepsi 1,5 l',8500,'Gaseosa.','',true,false,'',42),
('manzana-1-5-l','Bebidas','Manzana 1,5 l',8500,'Gaseosa.','',true,false,'',43),
('colombiana-1-5-l','Bebidas','Colombiana 1,5 l',8500,'Gaseosa.','',true,false,'',44),
('agua-600-ml','Bebidas','Agua 600 ml',4500,'Agua mineral.','',true,false,'',45),
('sangria-de-vino-tinto','Bebidas','Sangría de vino tinto',17000,'500 ml de sangría de vino tinto con fresa, manzana y naranja.','',true,false,'',46),
('sangria-de-vino-blanco','Bebidas','Sangría de vino blanco',19000,'Sangría de vino blanco con lichi y fresa.','',true,false,'',47),
('galleta-volcan-con-helado','Postres','Galleta volcán con helado',17000,'Galleta artesanal con chips de chocolate y arequipe, acompañada con helado.','https://images.rappi.com/products/3c726737-e16e-4fef-8b7a-5941cb552332-1729888996105.png?d=700x700&e=webp&q=80',true,true,'',48),
('el-more-con-helado','Postres','El more con helado',16000,'Brownie de la casa recién horneado con helado de vainilla.','',true,false,'',49),
('cheesecake-de-temporada','Postres','Cheesecake de temporada',15000,'Cheesecake con salsa de frutos rojos, uchuva o gulupa.','',true,false,'',50)
on conflict(id) do nothing;

insert into public.site_settings(key,value) values('site','{}'::jsonb) on conflict(key) do nothing;
-- A continuación: en Authentication -> Users crea un usuario con correo/contraseña;
-- luego REEMPLAZA el correo por el de ese usuario autorizado y EJECUTA esta línea por separado:
-- insert into public.admin_users(user_id)
-- select id from auth.users where email='ADMIN@TU-DOMINIO.COM'
-- on conflict do nothing;
