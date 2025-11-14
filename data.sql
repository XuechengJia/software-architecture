--
-- PostgreSQL database dump
--

\restrict i8TENNaenrQuF2RB84vGpyf28JTBmKEk974gyrROQhYmBK8ly8ehwHXBghOt7TH

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

-- Started on 2025-11-13 15:59:55

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 2 (class 3079 OID 67755)
-- Name: postgis; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA public;


--
-- TOC entry 5907 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION postgis; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION postgis IS 'PostGIS geometry and geography spatial types and functions';


--
-- TOC entry 264 (class 1255 OID 68835)
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 232 (class 1259 OID 75947)
-- Name: complaints; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.complaints (
    id integer NOT NULL,
    type character varying(32) NOT NULL,
    description text NOT NULL,
    photo_url character varying(255),
    location public.geometry(Point,4326) NOT NULL,
    status character varying(16) DEFAULT '未处理'::character varying,
    created_at timestamp without time zone DEFAULT now(),
    handled_at timestamp without time zone,
    handler character varying(64)
);
CREATE TABLE public.complaint_tasks (
                                        id              serial PRIMARY KEY,
                                        complaint_id    integer NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
                                        maintainer_id   integer NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
                                        status          character varying(16) NOT NULL DEFAULT '待处理',
                                        result_text     text,
                                        result_photo_url character varying(255),
                                        result_location public.geometry(Point,4326),
                                        created_at      timestamp without time zone DEFAULT now(),
                                        completed_at    timestamp without time zone
);
CREATE TABLE public.park_fences (
                                    id              serial PRIMARY KEY,
                                    park_id         integer NOT NULL REFERENCES public.parks(id) ON DELETE CASCADE,
                                    fence_type      character varying(32) NOT NULL,  -- 比如：RIDE（骑行范围）、PARKING（停车区）
                                    name            character varying(64) NOT NULL,
                                    coordinates     text,                            -- 暂时用文本存边界坐标（如 JSON 或 "lng,lat;lng,lat"）
                                    created_at      timestamp without time zone DEFAULT now()
);


--
-- TOC entry 231 (class 1259 OID 75946)
-- Name: complaints_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.complaints_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5908 (class 0 OID 0)
-- Dependencies: 231
-- Name: complaints_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.complaints_id_seq OWNED BY public.complaints.id;


--
-- TOC entry 225 (class 1259 OID 68844)
-- Name: rides; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rides (
    id integer NOT NULL,
    user_id integer NOT NULL,
    vehicle_id integer NOT NULL,
    park_id integer NOT NULL,
    start_time timestamp without time zone NOT NULL,
    end_time timestamp without time zone,
    fee numeric(10,2) DEFAULT 0,
    status character varying(20) DEFAULT 'ONGOING'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    start_location public.geometry(Point,4326),
    end_location public.geometry(Point,4326),
    CONSTRAINT rides_status_check CHECK (((status)::text = ANY (ARRAY[('ONGOING'::character varying)::text, ('COMPLETED'::character varying)::text, ('CANCELLED'::character varying)::text])))
);


--
-- TOC entry 234 (class 1259 OID 84163)
-- Name: mv_daily_ride_counts; Type: MATERIALIZED VIEW; Schema: public; Owner: -
--

CREATE MATERIALIZED VIEW public.mv_daily_ride_counts AS
 SELECT (date_trunc('day'::text, start_time))::date AS day,
    count(*) AS rides
   FROM public.rides
  GROUP BY (date_trunc('day'::text, start_time))
  ORDER BY ((date_trunc('day'::text, start_time))::date) DESC
  WITH NO DATA;


--
-- TOC entry 223 (class 1259 OID 68836)
-- Name: parks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.parks (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    location character varying(255),
    geo_boundary json,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    center_lng numeric(10,6),
    center_lat numeric(10,6),
    boundary_coordinates json
);


--
-- TOC entry 224 (class 1259 OID 68843)
-- Name: parks_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.parks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5909 (class 0 OID 0)
-- Dependencies: 224
-- Name: parks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.parks_id_seq OWNED BY public.parks.id;


--
-- TOC entry 226 (class 1259 OID 68852)
-- Name: rides_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.rides_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5910 (class 0 OID 0)
-- Dependencies: 226
-- Name: rides_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.rides_id_seq OWNED BY public.rides.id;


--
-- TOC entry 233 (class 1259 OID 84138)
-- Name: user_parks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_parks (
    user_id integer NOT NULL,
    park_id integer NOT NULL
);


--
-- TOC entry 227 (class 1259 OID 68853)
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id integer NOT NULL,
    phone character varying(15) NOT NULL,
    password_hash character varying(255) NOT NULL,
    name character varying(100),
    role character varying(20) NOT NULL,
    status character varying(10) DEFAULT 'ACTIVE'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT users_role_check CHECK (((role)::text = ANY (ARRAY[('TENANT'::character varying)::text, ('OPERATOR'::character varying)::text, ('MAINTAINER'::character varying)::text, ('PARK_ADMIN'::character varying)::text]))),
    CONSTRAINT users_status_check CHECK (((status)::text = ANY (ARRAY[('ACTIVE'::character varying)::text, ('INACTIVE'::character varying)::text])))
);


--
-- TOC entry 228 (class 1259 OID 68861)
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5911 (class 0 OID 0)
-- Dependencies: 228
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- TOC entry 229 (class 1259 OID 68862)
-- Name: vehicles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vehicles (
    id integer NOT NULL,
    code character varying(50) NOT NULL,
    park_id integer NOT NULL,
    status character varying(20) DEFAULT 'IDLE'::character varying NOT NULL,
    battery integer DEFAULT 100,
    location public.geometry(Point,4326),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT vehicles_battery_check CHECK (((battery >= 0) AND (battery <= 100))),
    CONSTRAINT vehicles_status_check CHECK (((status)::text = ANY (ARRAY[('IDLE'::character varying)::text, ('IN_USE'::character varying)::text, ('LOCKED'::character varying)::text, ('MAINTENANCE'::character varying)::text])))
);


--
-- TOC entry 230 (class 1259 OID 68873)
-- Name: vehicles_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.vehicles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5912 (class 0 OID 0)
-- Dependencies: 230
-- Name: vehicles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.vehicles_id_seq OWNED BY public.vehicles.id;


--
-- TOC entry 5700 (class 2604 OID 75950)
-- Name: complaints id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.complaints ALTER COLUMN id SET DEFAULT nextval('public.complaints_id_seq'::regclass);


--
-- TOC entry 5683 (class 2604 OID 68874)
-- Name: parks id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.parks ALTER COLUMN id SET DEFAULT nextval('public.parks_id_seq'::regclass);


--
-- TOC entry 5686 (class 2604 OID 68875)
-- Name: rides id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rides ALTER COLUMN id SET DEFAULT nextval('public.rides_id_seq'::regclass);


--
-- TOC entry 5691 (class 2604 OID 68876)
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- TOC entry 5695 (class 2604 OID 68877)
-- Name: vehicles id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vehicles ALTER COLUMN id SET DEFAULT nextval('public.vehicles_id_seq'::regclass);


--
-- TOC entry 5899 (class 0 OID 75947)
-- Dependencies: 232
-- Data for Name: complaints; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.complaints (id, type, description, photo_url, location, status, created_at, handled_at, handler) FROM stdin;
6	不规范停车	0	/uploads/1762929815075.jpg	0101000020E610000082CD273ECE965C401640091D58873E40	未处理	2025-11-12 14:43:35.118804	\N	\N
\.


--
-- TOC entry 5890 (class 0 OID 68836)
-- Dependencies: 223
-- Data for Name: parks; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.parks (id, name, location, geo_boundary, created_at, updated_at, center_lng, center_lat, boundary_coordinates) FROM stdin;
1	科技园	北京市海淀区	{"type": "Point", "coordinates": [116.3, 39.9]}	2025-11-06 21:53:02.589866	2025-11-12 14:16:06.881678	116.310000	39.910000	[[116.305, 39.905], [116.315, 39.905], [116.315, 39.915], [116.305, 39.915], [116.305, 39.905]]
2	上海科技园区	上海市浦东新区	\N	2025-11-12 14:16:06.881678	2025-11-12 14:16:06.881678	121.470000	31.230000	[[121.46, 31.22], [121.48, 31.22], [121.48, 31.24], [121.46, 31.24], [121.46, 31.22]]
\.


--
-- TOC entry 5892 (class 0 OID 68844)
-- Dependencies: 225
-- Data for Name: rides; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.rides (id, user_id, vehicle_id, park_id, start_time, end_time, fee, status, created_at, updated_at, start_location, end_location) FROM stdin;
5	2	1	1	2025-11-06 22:54:53.759085	\N	0.00	ONGOING	2025-11-06 22:54:53.759085	2025-11-06 22:54:53.759085	\N	\N
6	2	2	1	2025-11-06 22:57:30.403052	\N	0.00	ONGOING	2025-11-06 22:57:30.403052	2025-11-06 22:57:30.403052	\N	\N
7	2	3	1	2025-11-06 22:58:58.564925	\N	0.00	ONGOING	2025-11-06 22:58:58.564925	2025-11-06 22:58:58.564925	\N	\N
8	2	3	1	2025-11-06 23:01:12.333118	2025-11-06 23:01:14.453	1.50	COMPLETED	2025-11-06 23:01:12.333118	2025-11-06 23:01:14.451102	\N	\N
9	2	1	1	2025-11-06 23:01:20.434093	\N	0.00	ONGOING	2025-11-06 23:01:20.434093	2025-11-06 23:01:20.434093	\N	\N
10	6	3	1	2025-11-07 12:34:14.245052	2025-11-07 13:21:13.01	70.50	COMPLETED	2025-11-07 12:34:14.245052	2025-11-07 13:21:12.99727	\N	\N
11	6	4	1	2025-11-07 13:21:21.72627	2025-11-07 13:21:41.69	1.50	COMPLETED	2025-11-07 13:21:21.72627	2025-11-07 13:21:41.686827	\N	\N
12	6	6	1	2025-11-07 13:24:10.117389	2025-11-07 13:24:18.604	1.50	COMPLETED	2025-11-07 13:24:10.117389	2025-11-07 13:24:18.602206	\N	\N
13	6	1	1	2025-11-07 13:29:36.997003	2025-11-07 13:29:45.123	1.50	COMPLETED	2025-11-07 13:29:36.997003	2025-11-07 13:29:45.108503	\N	\N
14	6	2	1	2025-11-07 13:29:57.077295	2025-11-07 13:29:58.87	1.50	COMPLETED	2025-11-07 13:29:57.077295	2025-11-07 13:29:58.870145	\N	\N
15	6	8	1	2025-11-07 13:30:28.528011	2025-11-07 13:30:31.162	1.50	COMPLETED	2025-11-07 13:30:28.528011	2025-11-07 13:30:31.162167	\N	\N
16	6	10	1	2025-11-07 13:34:38.147557	2025-11-07 13:34:45.513	1.50	COMPLETED	2025-11-07 13:34:38.147557	2025-11-07 13:34:45.509609	\N	\N
19	17	1	1	2025-11-10 15:22:05.08815	2025-11-10 15:37:05.08815	3.00	COMPLETED	2025-11-12 15:22:05.08815	2025-11-12 15:22:05.08815	0101000020E6100000F1A0D9756F195D4063450DA661F44340	0101000020E6100000022B8716D9195D40D3D9C9E028F54340
20	18	2	1	2025-11-02 15:22:05.08815	2025-11-02 15:47:05.08815	5.00	COMPLETED	2025-11-12 15:22:05.08815	2025-11-12 15:22:05.08815	0101000020E61000003D0AD7A370195D403F355EBA49F44340	0101000020E610000060E5D022DB195D4085EB51B81EF54340
21	17	1	1	2025-11-11 15:22:05.08815	2025-11-11 15:30:05.08815	1.50	COMPLETED	2025-11-12 15:22:05.08815	2025-11-12 15:22:05.08815	0101000020E6100000F1A0D9756F195D4063450DA661F44340	0101000020E6100000A8C64B3789195D4014AE47E17AF44340
22	19	3	1	2025-11-12 12:22:05.08815	2025-11-12 12:37:05.08815	4.00	COMPLETED	2025-11-12 15:22:05.08815	2025-11-12 15:22:05.08815	0101000020E6100000B81E85EB51185D403333333333F34340	0101000020E6100000295C8FC2F5185D40A4703D0AD7F34340
\.


--
-- TOC entry 5682 (class 0 OID 68077)
-- Dependencies: 219
-- Data for Name: spatial_ref_sys; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.spatial_ref_sys (srid, auth_name, auth_srid, srtext, proj4text) FROM stdin;
\.


--
-- TOC entry 5900 (class 0 OID 84138)
-- Dependencies: 233
-- Data for Name: user_parks; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_parks (user_id, park_id) FROM stdin;
\.


--
-- TOC entry 5894 (class 0 OID 68853)
-- Dependencies: 227
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, phone, password_hash, name, role, status, created_at, updated_at) FROM stdin;
5	13800138002	$2a$10$3z6d9Kj8xYvL5pQrT2s9eOJf8Gh7JkLmN1vWxYcZ4pQrT2s9eOJf8	张二	TENANT	ACTIVE	2025-11-06 21:21:19.261069	2025-11-06 21:21:19.261069
2	13800138001	$2b$10$PS/4FeNVqzlTZt.ozHJxPOVCj/FXzefGJbecCFtrOcs/nhAIgzkW2	张三	TENANT	ACTIVE	2025-11-06 20:55:04.026023	2025-11-06 22:41:43.763543
6	19959181829	$2b$10$rb329s4IzmOD6.cQ6W01mu3TpCJ1Lj9af9Z4/DMCWF7aC5dEMFH5.	csh	TENANT	ACTIVE	2025-11-07 12:27:56.248801	2025-11-07 12:27:56.248801
7	13800138003	$2b$10$a1llfFoBv4bfH.Njwcu/x.Stdc.S4og2NiHnUPe5RsD/rkS1rU2OG	www	PARK_ADMIN	ACTIVE	2025-11-10 14:32:08.571186	2025-11-10 14:32:08.571186
8	13800138004	$2b$10$RfQzolE08wZynaYxBWgMuuagWkOjp89CPKP.MQYm8CWQSH7CitrBu	222	TENANT	ACTIVE	2025-11-10 15:08:14.146862	2025-11-10 15:08:14.146862
9	13800138005	$2b$10$TGcsNq9tKVKT2ZglcB3DXeITIyFiigsuODU.rcxJQ5Uxvcr215.12	333	OPERATOR	ACTIVE	2025-11-12 14:41:43.643581	2025-11-12 14:41:43.643581
10	13800138006	$2b$10$yXSk3azuYIb36rTz7sHZ7ex8KW.o9iV3Ppeh49fhxPOcbEpAt4NU6	444	MAINTAINER	ACTIVE	2025-11-12 14:42:15.222248	2025-11-12 14:42:15.222248
17	13800000001	$2b$10$EXAMPLEHASH0000000000000000000000000000000000000000	租客A	TENANT	ACTIVE	2025-11-12 15:22:05.08815	2025-11-12 15:22:05.08815
18	13800000002	$2b$10$EXAMPLEHASH0000000000000000000000000000000000000000	租客B	TENANT	ACTIVE	2025-11-12 15:22:05.08815	2025-11-12 15:22:05.08815
19	13800000003	$2b$10$EXAMPLEHASH0000000000000000000000000000000000000000	租客C	TENANT	ACTIVE	2025-11-12 15:22:05.08815	2025-11-12 15:22:05.08815
\.


--
-- TOC entry 5896 (class 0 OID 68862)
-- Dependencies: 229
-- Data for Name: vehicles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.vehicles (id, code, park_id, status, battery, location, created_at, updated_at) FROM stdin;
5	EBK-005	1	IN_USE	25	0101000020E61000008C3995B846155D40894248D190F34340	2025-11-07 13:04:55.544619	2025-11-07 13:04:55.544619
7	EBR-007	1	IN_USE	27	0101000020E6100000BFBC59DF62125D40D97ACBA583F64340	2025-11-07 13:04:55.544619	2025-11-07 13:04:55.544619
9	EBT-009	1	IN_USE	29	0101000020E6100000DB1BD534FC135D40BB9E6DB20DF64340	2025-11-07 13:04:55.544619	2025-11-07 13:04:55.544619
11	EBC-011	1	IN_USE	31	0101000020E610000061F3FE5DF1165D406B14941776F44340	2025-11-07 13:04:55.544619	2025-11-07 13:04:55.544619
12	EBR-012	1	IDLE	32	0101000020E610000055F9E4D22A165D401C4E1C0670F14340	2025-11-07 13:04:55.544619	2025-11-07 13:04:55.544619
13	EBS-013	1	IN_USE	33	0101000020E610000016232562F2125D40C97D3043D3F24340	2025-11-07 13:04:55.544619	2025-11-07 13:04:55.544619
14	EBT-014	1	IDLE	34	0101000020E6100000337B667B94165D40AAAB87CA4FF64340	2025-11-07 13:04:55.544619	2025-11-07 13:04:55.544619
15	EBK-015	1	IN_USE	35	0101000020E61000005C4C526099155D40DDF866B99BF44340	2025-11-07 13:04:55.544619	2025-11-07 13:04:55.544619
16	EBC-016	1	IDLE	36	0101000020E610000016070C23BE135D403EE7DE77D5F74340	2025-11-07 13:04:55.544619	2025-11-07 13:04:55.544619
17	EBR-017	1	IN_USE	37	0101000020E610000051700706D2135D408A9C40124DF64340	2025-11-07 13:04:55.544619	2025-11-07 13:04:55.544619
18	EBS-018	1	IDLE	38	0101000020E6100000986CD5327E145D404BE51F88C7F14340	2025-11-07 13:04:55.544619	2025-11-07 13:04:55.544619
19	EBT-019	1	IN_USE	39	0101000020E6100000AD79A6D636135D403FF4F3AA69F44340	2025-11-07 13:04:55.544619	2025-11-07 13:04:55.544619
20	EBK-020	1	IDLE	40	0101000020E6100000A89E677609165D401F9801C462F74340	2025-11-07 13:04:55.544619	2025-11-07 13:04:55.544619
21	EBC-021	1	IN_USE	41	0101000020E6100000A9F18E90AD155D4099A92EE408F54340	2025-11-07 13:04:55.544619	2025-11-07 13:04:55.544619
22	EBR-022	1	IDLE	42	0101000020E61000006007959E12165D4057A709D558F24340	2025-11-07 13:04:55.544619	2025-11-07 13:04:55.544619
23	EBS-023	1	IN_USE	43	0101000020E6100000CF93F4F132155D40EB3484E810F44340	2025-11-07 13:04:55.544619	2025-11-07 13:04:55.544619
24	EBT-024	1	IDLE	44	0101000020E610000075EC2BAE83125D40B47960333BF84340	2025-11-07 13:04:55.544619	2025-11-07 13:04:55.544619
25	EBK-025	1	IN_USE	45	0101000020E610000024D4A3336A165D40B11F6BF1D3F14340	2025-11-07 13:04:55.544619	2025-11-07 13:04:55.544619
26	EBC-026	1	IDLE	46	0101000020E6100000299561ABF8115D407D27C62343F34340	2025-11-07 13:04:55.544619	2025-11-07 13:04:55.544619
27	EBR-027	1	IN_USE	47	0101000020E6100000B40C6F7964155D400C5CACA531F44340	2025-11-07 13:04:55.544619	2025-11-07 13:04:55.544619
28	EBS-028	1	IDLE	48	0101000020E61000007390E1B4CA125D404C6C36D44FF84340	2025-11-07 13:04:55.544619	2025-11-07 13:04:55.544619
29	EBT-029	1	IN_USE	49	0101000020E61000009433EE09F3155D403491C367CFF54340	2025-11-07 13:04:55.544619	2025-11-07 13:04:55.544619
30	EBK-030	1	IDLE	50	0101000020E61000003409187BE2145D40F61A9EBCD9F44340	2025-11-07 13:04:55.544619	2025-11-07 13:04:55.544619
3	EBK-003	1	IDLE	95	0101000020E61000003333333333135D403333333333F34340	2025-11-06 21:56:31.900874	2025-11-07 13:21:12.99727
4	EBT-004	1	IDLE	24	0101000020E6100000EFD35B8D23165D408266AEBB33F34340	2025-11-07 13:04:55.544619	2025-11-07 13:21:41.686827
6	EBC-006	1	IDLE	26	0101000020E6100000723E219712155D406530145DCBF54340	2025-11-07 13:04:55.544619	2025-11-07 13:24:18.602206
1	EBK-001	1	IDLE	85	0101000020E6100000A4703D0AD7135D4014AE47E17AF44340	2025-11-06 21:56:31.900874	2025-11-07 13:29:45.108503
2	EBK-002	1	IDLE	62	0101000020E610000014AE47E17A145D40F6285C8FC2F54340	2025-11-06 21:56:31.900874	2025-11-07 13:29:58.870145
8	EBS-008	1	IDLE	28	0101000020E6100000CAF3E87801145D401E9B088897F54340	2025-11-07 13:04:55.544619	2025-11-07 13:30:31.162167
10	EBK-010	1	IDLE	30	0101000020E61000004E9FCA5EF5115D40E8148A9AAFF54340	2025-11-07 13:04:55.544619	2025-11-07 13:34:45.509609
\.


--
-- TOC entry 5913 (class 0 OID 0)
-- Dependencies: 231
-- Name: complaints_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.complaints_id_seq', 6, true);


--
-- TOC entry 5914 (class 0 OID 0)
-- Dependencies: 224
-- Name: parks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.parks_id_seq', 2, true);


--
-- TOC entry 5915 (class 0 OID 0)
-- Dependencies: 226
-- Name: rides_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.rides_id_seq', 22, true);


--
-- TOC entry 5916 (class 0 OID 0)
-- Dependencies: 228
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_id_seq', 19, true);


--
-- TOC entry 5917 (class 0 OID 0)
-- Dependencies: 230
-- Name: vehicles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.vehicles_id_seq', 30, true);


--
-- TOC entry 5726 (class 2606 OID 75956)
-- Name: complaints complaints_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.complaints
    ADD CONSTRAINT complaints_pkey PRIMARY KEY (id);


--
-- TOC entry 5712 (class 2606 OID 68879)
-- Name: parks parks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.parks
    ADD CONSTRAINT parks_pkey PRIMARY KEY (id);


--
-- TOC entry 5716 (class 2606 OID 68881)
-- Name: rides rides_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rides
    ADD CONSTRAINT rides_pkey PRIMARY KEY (id);


--
-- TOC entry 5728 (class 2606 OID 84142)
-- Name: user_parks user_parks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_parks
    ADD CONSTRAINT user_parks_pkey PRIMARY KEY (user_id, park_id);


--
-- TOC entry 5718 (class 2606 OID 68883)
-- Name: users users_phone_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_phone_key UNIQUE (phone);


--
-- TOC entry 5720 (class 2606 OID 68885)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 5722 (class 2606 OID 68887)
-- Name: vehicles vehicles_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vehicles
    ADD CONSTRAINT vehicles_code_key UNIQUE (code);


--
-- TOC entry 5724 (class 2606 OID 68889)
-- Name: vehicles vehicles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vehicles
    ADD CONSTRAINT vehicles_pkey PRIMARY KEY (id);


--
-- TOC entry 5713 (class 1259 OID 84162)
-- Name: idx_rides_end_location; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rides_end_location ON public.rides USING gist (end_location);


--
-- TOC entry 5714 (class 1259 OID 84161)
-- Name: idx_rides_start_location; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rides_start_location ON public.rides USING gist (start_location);


--
-- TOC entry 5735 (class 2620 OID 68890)
-- Name: parks update_parks_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_parks_updated_at BEFORE UPDATE ON public.parks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5736 (class 2620 OID 68891)
-- Name: rides update_rides_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_rides_updated_at BEFORE UPDATE ON public.rides FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5737 (class 2620 OID 68892)
-- Name: users update_users_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5738 (class 2620 OID 68893)
-- Name: vehicles update_vehicles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON public.vehicles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5729 (class 2606 OID 68894)
-- Name: rides rides_park_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rides
    ADD CONSTRAINT rides_park_id_fkey FOREIGN KEY (park_id) REFERENCES public.parks(id) ON DELETE RESTRICT;


--
-- TOC entry 5730 (class 2606 OID 68899)
-- Name: rides rides_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rides
    ADD CONSTRAINT rides_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- TOC entry 5731 (class 2606 OID 68904)
-- Name: rides rides_vehicle_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rides
    ADD CONSTRAINT rides_vehicle_id_fkey FOREIGN KEY (vehicle_id) REFERENCES public.vehicles(id) ON DELETE RESTRICT;


--
-- TOC entry 5733 (class 2606 OID 84148)
-- Name: user_parks user_parks_park_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_parks
    ADD CONSTRAINT user_parks_park_id_fkey FOREIGN KEY (park_id) REFERENCES public.parks(id) ON DELETE CASCADE;


--
-- TOC entry 5734 (class 2606 OID 84143)
-- Name: user_parks user_parks_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_parks
    ADD CONSTRAINT user_parks_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5732 (class 2606 OID 68909)
-- Name: vehicles vehicles_park_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vehicles
    ADD CONSTRAINT vehicles_park_id_fkey FOREIGN KEY (park_id) REFERENCES public.parks(id) ON DELETE CASCADE;


--
-- TOC entry 5901 (class 0 OID 84163)
-- Dependencies: 234 5903
-- Name: mv_daily_ride_counts; Type: MATERIALIZED VIEW DATA; Schema: public; Owner: -
--

REFRESH MATERIALIZED VIEW public.mv_daily_ride_counts;


-- Completed on 2025-11-13 15:59:55

--
-- PostgreSQL database dump complete
--

\unrestrict i8TENNaenrQuF2RB84vGpyf28JTBmKEk974gyrROQhYmBK8ly8ehwHXBghOt7TH

