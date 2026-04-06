#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

const BASE_URL = 'https://api.pubrio.com';

async function pubrioRequest(
	apiKey: string,
	method: string,
	endpoint: string,
	body?: Record<string, unknown>,
): Promise<unknown> {
	const options: RequestInit = {
		method,
		headers: {
			'pubrio-api-key': apiKey,
			'Content-Type': 'application/json',
		},
	};

	if (body && Object.keys(body).length > 0) {
		options.body = JSON.stringify(body);
	}

	const response = await fetch(`${BASE_URL}${endpoint}`, options);

	if (!response.ok) {
		const text = await response.text();
		throw new Error(`Pubrio API error ${response.status}: ${text}`);
	}

	const json = (await response.json()) as { data?: unknown };
	return json.data !== undefined ? json.data : json;
}

function getApiKey(): string {
	const key = process.env.PUBRIO_API_KEY;
	if (!key) {
		throw new Error('PUBRIO_API_KEY environment variable is required');
	}
	return key;
}

function splitComma(value: string | undefined): string[] | undefined {
	if (!value) return undefined;
	return value
		.split(',')
		.map((s) => s.trim())
		.filter(Boolean);
}

const server = new McpServer({
	name: 'pubrio',
	version: '1.0.0',
	description:
		'Pubrio — the glocalized business data layer for AI agents. Search the whole market, not just the 30% in mainstream datasets.',
});

// 1. Search Companies
server.tool(
	'search_companies',
	'Search B2B companies by name, domain, location, industry, technology, or headcount',
	{
		company_name: z.string().optional().describe('Company name to search for'),
		domains: z.string().optional().describe('Comma-separated list of domains (e.g. "google.com,apple.com")'),
		locations: z.string().optional().describe('Comma-separated location codes'),
		keywords: z.string().optional().describe('Comma-separated keywords'),
		verticals: z.string().optional().describe('Comma-separated industry verticals'),
		technologies: z.string().optional().describe('Comma-separated technologies'),
		employees_min: z.number().optional().describe('Minimum number of employees'),
		employees_max: z.number().optional().describe('Maximum number of employees'),
		page: z.number().optional().describe('Page number (default 1)'),
		per_page: z.number().optional().describe('Results per page (default 25, max 25)'),
	},
	async (params) => {
		const body: Record<string, unknown> = {
			page: params.page ?? 1,
			per_page: params.per_page ?? 25,
		};
		if (params.company_name) body.company_name = params.company_name;
		if (params.domains) body.domains = splitComma(params.domains);
		if (params.locations) body.locations = splitComma(params.locations);
		if (params.keywords) body.keywords = splitComma(params.keywords);
		if (params.verticals) body.verticals = splitComma(params.verticals);
		if (params.technologies) body.technologies = splitComma(params.technologies);
		if (params.employees_min != null || params.employees_max != null) {
			body.employees = [params.employees_min ?? 1, params.employees_max ?? 1000000];
		}
		const result = await pubrioRequest(getApiKey(), 'POST', '/companies/search', body);
		return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
	},
);

// 2. Lookup Company
server.tool(
	'lookup_company',
	'Look up detailed company information by domain, LinkedIn URL, or domain search ID',
	{
		domain: z.string().optional().describe('Company domain (e.g. "google.com")'),
		linkedin_url: z.string().optional().describe('Company LinkedIn URL'),
		domain_search_id: z.string().optional().describe('Pubrio domain search ID'),
	},
	async (params) => {
		const body: Record<string, unknown> = {};
		if (params.domain_search_id) body.domain_search_id = params.domain_search_id;
		else if (params.domain) body.domain = params.domain;
		else if (params.linkedin_url) body.linkedin_url = params.linkedin_url;
		const result = await pubrioRequest(getApiKey(), 'POST', '/companies/lookup', body);
		return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
	},
);

// 3. Enrich Company
server.tool(
	'enrich_company',
	'Enrich company data with full firmographic details (uses credits)',
	{
		domain: z.string().optional().describe('Company domain (e.g. "google.com")'),
		linkedin_url: z.string().optional().describe('Company LinkedIn URL'),
		domain_search_id: z.string().optional().describe('Pubrio domain search ID'),
	},
	async (params) => {
		const body: Record<string, unknown> = {};
		if (params.domain_search_id) body.domain_search_id = params.domain_search_id;
		else if (params.domain) body.domain = params.domain;
		else if (params.linkedin_url) body.linkedin_url = params.linkedin_url;
		const result = await pubrioRequest(getApiKey(), 'POST', '/companies/lookup/enrich', body);
		return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
	},
);

// 4. Search People
server.tool(
	'search_people',
	'Search business professionals by name, title, department, seniority, or company',
	{
		search_term: z.string().optional().describe('General search term'),
		people_name: z.string().optional().describe('Person name to search'),
		people_titles: z.string().optional().describe('Comma-separated job titles'),
		peoples: z.string().optional().describe('Comma-separated people identifiers'),
		management_levels: z.string().optional().describe('Comma-separated seniority levels'),
		departments: z.string().optional().describe('Comma-separated departments'),
		department_functions: z.string().optional().describe('Comma-separated department functions'),
		employees: z.string().optional().describe('Comma-separated employee range (e.g. "1,1000")'),
		people_locations: z.string().optional().describe('Comma-separated people location codes'),
		company_locations: z.string().optional().describe('Comma-separated company location codes'),
		company_linkedin_urls: z.string().optional().describe('Comma-separated company LinkedIn URLs'),
		linkedin_urls: z.string().optional().describe('Comma-separated person LinkedIn URLs'),
		companies: z.string().optional().describe('Comma-separated company names'),
		domains: z.string().optional().describe('Comma-separated company domains'),
		page: z.number().optional().describe('Page number (default 1)'),
		per_page: z.number().optional().describe('Results per page (default 25, max 25)'),
	},
	async (params) => {
		const body: Record<string, unknown> = {
			page: params.page ?? 1,
			per_page: params.per_page ?? 25,
		};
		if (params.search_term) body.search_term = params.search_term;
		if (params.people_name) body.people_name = params.people_name;
		if (params.people_titles) body.people_titles = splitComma(params.people_titles);
		if (params.peoples) body.peoples = splitComma(params.peoples);
		if (params.management_levels) body.management_levels = splitComma(params.management_levels);
		if (params.departments) body.departments = splitComma(params.departments);
		if (params.department_functions) body.department_functions = splitComma(params.department_functions);
		if (params.employees) body.employees = splitComma(params.employees)?.map(Number);
		if (params.people_locations) body.people_locations = splitComma(params.people_locations);
		if (params.company_locations) body.company_locations = splitComma(params.company_locations);
		if (params.company_linkedin_urls) body.company_linkedin_urls = splitComma(params.company_linkedin_urls);
		if (params.linkedin_urls) body.linkedin_urls = splitComma(params.linkedin_urls);
		if (params.companies) body.companies = splitComma(params.companies);
		if (params.domains) body.domains = splitComma(params.domains);
		const result = await pubrioRequest(getApiKey(), 'POST', '/people/search', body);
		return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
	},
);

// 5. Lookup Person
server.tool(
	'lookup_person',
	"Look up a person's professional profile by LinkedIn URL or Pubrio ID",
	{
		linkedin_url: z.string().optional().describe('Person LinkedIn URL'),
		people_search_id: z.string().optional().describe('Pubrio people search ID'),
	},
	async (params) => {
		const body: Record<string, unknown> = {};
		if (params.linkedin_url) body.linkedin_url = params.linkedin_url;
		else if (params.people_search_id) body.people_search_id = params.people_search_id;
		const result = await pubrioRequest(getApiKey(), 'POST', '/people/lookup', body);
		return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
	},
);

// 5b. People LinkedIn Lookup
server.tool(
	'lookup_person_linkedin',
	"Look up a person's professional profile by their LinkedIn URL (dedicated LinkedIn lookup endpoint)",
	{
		people_linkedin_url: z.string().describe('Person LinkedIn URL'),
	},
	async (params) => {
		const body: Record<string, unknown> = {
			people_linkedin_url: params.people_linkedin_url,
		};
		const result = await pubrioRequest(getApiKey(), 'POST', '/people/linkedin/lookup', body);
		return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
	},
);

// 6. Enrich Person
server.tool(
	'enrich_person',
	'Enrich person data with full professional details (uses credits)',
	{
		linkedin_url: z.string().optional().describe('Person LinkedIn URL'),
		people_search_id: z.string().optional().describe('Pubrio people search ID'),
	},
	async (params) => {
		const body: Record<string, unknown> = {};
		if (params.linkedin_url) body.linkedin_url = params.linkedin_url;
		else if (params.people_search_id) body.people_search_id = params.people_search_id;
		const result = await pubrioRequest(getApiKey(), 'POST', '/people/enrichment', body);
		return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
	},
);

// 7. Reveal Contact
server.tool(
	'reveal_contact',
	'Reveal email or phone number for a person (uses credits)',
	{
		people_search_id: z.string().optional().describe('Pubrio people search ID'),
		linkedin_url: z.string().optional().describe('Person LinkedIn URL'),
		people_contact_types: z
			.string()
			.optional()
			.describe('Comma-separated contact types: email-personal, email-work, phone'),
	},
	async (params) => {
		const body: Record<string, unknown> = {};
		if (params.people_search_id) body.people_search_id = params.people_search_id;
		if (params.linkedin_url) body.linkedin_url = params.linkedin_url;
		if (params.people_contact_types) body.people_contact_types = splitComma(params.people_contact_types);
		const result = await pubrioRequest(getApiKey(), 'POST', '/redeem/people', body);
		return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
	},
);

// 8. Search Jobs
server.tool(
	'search_jobs',
	'Search job postings across companies',
	{
		search_term: z.string().optional().describe('Job search term'),
		search_terms: z.string().optional().describe('Comma-separated job search terms'),
		titles: z.string().optional().describe('Comma-separated job titles'),
		posted_dates: z.string().optional().describe('Comma-separated posted date filters'),
		locations: z.string().optional().describe('Comma-separated job locations'),
		exclude_locations: z.string().optional().describe('Comma-separated locations to exclude'),
		company_locations: z.string().optional().describe('Comma-separated company location codes'),
		companies: z.string().optional().describe('Comma-separated company names'),
		domains: z.string().optional().describe('Comma-separated company domains'),
		linkedin_urls: z.string().optional().describe('Comma-separated company LinkedIn URLs'),
		page: z.number().optional().describe('Page number (default 1)'),
		per_page: z.number().optional().describe('Results per page (default 25, max 25)'),
	},
	async (params) => {
		const body: Record<string, unknown> = {
			page: params.page ?? 1,
			per_page: params.per_page ?? 25,
		};
		if (params.search_term) body.search_term = params.search_term;
		if (params.search_terms) body.search_terms = splitComma(params.search_terms);
		if (params.titles) body.titles = splitComma(params.titles);
		if (params.posted_dates) body.posted_dates = splitComma(params.posted_dates);
		if (params.locations) body.locations = splitComma(params.locations);
		if (params.exclude_locations) body.exclude_locations = splitComma(params.exclude_locations);
		if (params.company_locations) body.company_locations = splitComma(params.company_locations);
		if (params.companies) body.companies = splitComma(params.companies);
		if (params.domains) body.domains = splitComma(params.domains);
		if (params.linkedin_urls) body.linkedin_urls = splitComma(params.linkedin_urls);
		const result = await pubrioRequest(getApiKey(), 'POST', '/companies/jobs/search', body);
		return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
	},
);

// 9. Search News
server.tool(
	'search_news',
	'Search company news and press releases',
	{
		search_term: z.string().optional().describe('News search term'),
		search_terms: z.string().optional().describe('Comma-separated news search terms'),
		categories: z.string().optional().describe('Comma-separated news categories'),
		published_dates: z.string().optional().describe('Comma-separated published date filters'),
		locations: z.string().optional().describe('Comma-separated location codes'),
		company_locations: z.string().optional().describe('Comma-separated company location codes'),
		companies: z.string().optional().describe('Comma-separated company names'),
		domains: z.string().optional().describe('Comma-separated company domains'),
		linkedin_urls: z.string().optional().describe('Comma-separated company LinkedIn URLs'),
		news_gallery_ids: z.string().optional().describe('Comma-separated news gallery IDs'),
		news_galleries: z.string().optional().describe('Comma-separated news gallery names'),
		news_languages: z.string().optional().describe('Comma-separated news language codes'),
		page: z.number().optional().describe('Page number (default 1)'),
		per_page: z.number().optional().describe('Results per page (default 25, max 25)'),
	},
	async (params) => {
		const body: Record<string, unknown> = {
			page: params.page ?? 1,
			per_page: params.per_page ?? 25,
		};
		if (params.search_term) body.search_term = params.search_term;
		if (params.search_terms) body.search_terms = splitComma(params.search_terms);
		if (params.categories) body.categories = splitComma(params.categories);
		if (params.published_dates) body.published_dates = splitComma(params.published_dates);
		if (params.locations) body.locations = splitComma(params.locations);
		if (params.company_locations) body.company_locations = splitComma(params.company_locations);
		if (params.companies) body.companies = splitComma(params.companies);
		if (params.domains) body.domains = splitComma(params.domains);
		if (params.linkedin_urls) body.linkedin_urls = splitComma(params.linkedin_urls);
		if (params.news_gallery_ids) body.news_gallery_ids = splitComma(params.news_gallery_ids);
		if (params.news_galleries) body.news_galleries = splitComma(params.news_galleries);
		if (params.news_languages) body.news_languages = splitComma(params.news_languages);
		const result = await pubrioRequest(getApiKey(), 'POST', '/companies/news/search', body);
		return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
	},
);

// 9b. Search Advertisements
server.tool(
	'search_ads',
	'Search company advertisements and ad campaigns',
	{
		search_terms: z.string().optional().describe('Comma-separated ad search terms'),
		headlines: z.string().optional().describe('Comma-separated ad headlines'),
		target_locations: z.string().optional().describe('Comma-separated target location codes'),
		exclude_target_locations: z.string().optional().describe('Comma-separated target locations to exclude'),
		start_dates: z.string().optional().describe('Comma-separated start date filters'),
		end_dates: z.string().optional().describe('Comma-separated end date filters'),
		company_locations: z.string().optional().describe('Comma-separated company location codes'),
		companies: z.string().optional().describe('Comma-separated company names'),
		domains: z.string().optional().describe('Comma-separated company domains'),
		linkedin_urls: z.string().optional().describe('Comma-separated company LinkedIn URLs'),
		filter_conditions: z.string().optional().describe('JSON string of filter conditions'),
		page: z.number().optional().describe('Page number (default 1)'),
		per_page: z.number().optional().describe('Results per page (default 25, max 25)'),
	},
	async (params) => {
		const body: Record<string, unknown> = {
			page: params.page ?? 1,
			per_page: params.per_page ?? 25,
		};
		if (params.search_terms) body.search_terms = splitComma(params.search_terms);
		if (params.headlines) body.headlines = splitComma(params.headlines);
		if (params.target_locations) body.target_locations = splitComma(params.target_locations);
		if (params.exclude_target_locations) body.exclude_target_locations = splitComma(params.exclude_target_locations);
		if (params.start_dates) body.start_dates = splitComma(params.start_dates);
		if (params.end_dates) body.end_dates = splitComma(params.end_dates);
		if (params.company_locations) body.company_locations = splitComma(params.company_locations);
		if (params.companies) body.companies = splitComma(params.companies);
		if (params.domains) body.domains = splitComma(params.domains);
		if (params.linkedin_urls) body.linkedin_urls = splitComma(params.linkedin_urls);
		if (params.filter_conditions) body.filter_conditions = JSON.parse(params.filter_conditions);
		const result = await pubrioRequest(getApiKey(), 'POST', '/companies/advertisements/search', body);
		return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
	},
);

// 10. Find Similar Companies
server.tool(
	'find_similar_companies',
	'Find companies similar to a given company by domain, LinkedIn URL, or domain search ID',
	{
		domain: z.string().optional().describe('Company domain (e.g. "google.com")'),
		linkedin_url: z.string().optional().describe('Company LinkedIn URL'),
		domain_search_id: z.string().optional().describe('Pubrio domain search ID'),
		locations: z.string().optional().describe('Comma-separated location codes'),
		exclude_locations: z.string().optional().describe('Comma-separated locations to exclude'),
		technologies: z.string().optional().describe('Comma-separated technologies'),
		categories: z.string().optional().describe('Comma-separated categories'),
		verticals: z.string().optional().describe('Comma-separated industry verticals'),
		vertical_categories: z.string().optional().describe('Comma-separated vertical categories'),
		vertical_sub_categories: z.string().optional().describe('Comma-separated vertical sub-categories'),
		employees: z.string().optional().describe('Comma-separated employee range (e.g. "1,1000")'),
		founded_dates: z.string().optional().describe('Comma-separated founded date filters'),
		revenues: z.string().optional().describe('Comma-separated revenue filters'),
		job_locations: z.string().optional().describe('Comma-separated job location codes'),
		job_posted_dates: z.string().optional().describe('Comma-separated job posted date filters'),
		job_titles: z.string().optional().describe('Comma-separated job titles'),
		news_categories: z.string().optional().describe('Comma-separated news categories'),
		news_published_dates: z.string().optional().describe('Comma-separated news published date filters'),
		is_enable_similarity_search: z.boolean().optional().describe('Enable similarity search'),
		similarity_score: z.number().optional().describe('Similarity score threshold'),
		page: z.number().optional().describe('Page number (default 1)'),
		per_page: z.number().optional().describe('Results per page (default 25, max 25)'),
	},
	async (params) => {
		const body: Record<string, unknown> = {
			page: params.page ?? 1,
			per_page: params.per_page ?? 25,
		};
		if (params.domain_search_id) body.domain_search_id = params.domain_search_id;
		else if (params.domain) body.domain = params.domain;
		else if (params.linkedin_url) body.linkedin_url = params.linkedin_url;
		if (params.locations) body.locations = splitComma(params.locations);
		if (params.exclude_locations) body.exclude_locations = splitComma(params.exclude_locations);
		if (params.technologies) body.technologies = splitComma(params.technologies);
		if (params.categories) body.categories = splitComma(params.categories);
		if (params.verticals) body.verticals = splitComma(params.verticals);
		if (params.vertical_categories) body.vertical_categories = splitComma(params.vertical_categories);
		if (params.vertical_sub_categories) body.vertical_sub_categories = splitComma(params.vertical_sub_categories);
		if (params.employees) body.employees = splitComma(params.employees)?.map(Number);
		if (params.founded_dates) body.founded_dates = splitComma(params.founded_dates);
		if (params.revenues) body.revenues = splitComma(params.revenues);
		if (params.job_locations) body.job_locations = splitComma(params.job_locations);
		if (params.job_posted_dates) body.job_posted_dates = splitComma(params.job_posted_dates);
		if (params.job_titles) body.job_titles = splitComma(params.job_titles);
		if (params.news_categories) body.news_categories = splitComma(params.news_categories);
		if (params.news_published_dates) body.news_published_dates = splitComma(params.news_published_dates);
		if (params.is_enable_similarity_search != null) body.is_enable_similarity_search = params.is_enable_similarity_search;
		if (params.similarity_score != null) body.similarity_score = params.similarity_score;
		const result = await pubrioRequest(getApiKey(), 'POST', '/companies/lookalikes/search', body);
		return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
	},
);

// 11. Lookup Technology
server.tool(
	'lookup_technology',
	'Look up technologies used by a company',
	{
		domain: z.string().optional().describe('Company domain (e.g. "google.com")'),
		linkedin_url: z.string().optional().describe('Company LinkedIn URL'),
		domain_search_id: z.string().optional().describe('Pubrio domain search ID'),
		domain_id: z.number().optional().describe('Pubrio domain ID (integer)'),
	},
	async (params) => {
		const body: Record<string, unknown> = {};
		if (params.domain_search_id) body.domain_search_id = params.domain_search_id;
		else if (params.domain_id != null) body.domain_id = params.domain_id;
		else if (params.domain) body.domain = params.domain;
		else if (params.linkedin_url) body.linkedin_url = params.linkedin_url;
		const result = await pubrioRequest(getApiKey(), 'POST', '/technologies/lookup', body);
		return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
	},
);

// 12. Get Usage
server.tool(
	'get_usage',
	'Get current credit usage and subscription information for your Pubrio account',
	{},
	async () => {
		const result = await pubrioRequest(getApiKey(), 'POST', '/profile/usage');
		return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
	},
);

// 13. Get User
server.tool(
	'get_user',
	'Get details about the currently authenticated user',
	{},
	async () => {
		const result = await pubrioRequest(getApiKey(), 'GET', '/user');
		return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
	},
);

// 14. Validate Webhook
server.tool(
	'validate_webhook',
	'Test a webhook destination configuration with sample data',
	{
		webhook_url: z.string().describe('Webhook URL to test'),
		headers: z.string().optional().describe('JSON string of custom headers'),
	},
	async (params) => {
		const destinationConfig: Record<string, unknown> = { webhook_url: params.webhook_url };
		if (params.headers) destinationConfig.headers = JSON.parse(params.headers);
		const body: Record<string, unknown> = {
			destination_type: 'webhook',
			destination_config: destinationConfig,
		};
		const result = await pubrioRequest(getApiKey(), 'POST', '/monitors/webhook/validate', body);
		return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
	},
);

// 19. Get Monitor Statistics Chart
server.tool(
	'get_monitor_chart',
	'Get daily trigger statistics for a monitor over a date range',
	{
		monitor_id: z.string().describe('Monitor UUID'),
		start_date: z.string().describe('Start date (YYYY-MM-DD)'),
		end_date: z.string().describe('End date (YYYY-MM-DD)'),
	},
	async (params) => {
		const body = {
			monitor_id: params.monitor_id,
			start_date: params.start_date,
			end_date: params.end_date,
		};
		const result = await pubrioRequest(getApiKey(), 'POST', '/monitors/statistics/chart', body);
		return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
	},
);

// ── Company (new) ──────────────────────────────────────────────────────

// Lookup Company LinkedIn
server.tool(
	'lookup_company_linkedin',
	'Look up a company by its LinkedIn URL using the dedicated LinkedIn lookup endpoint',
	{
		linkedin_url: z.string().describe('Company LinkedIn URL'),
	},
	async (params) => {
		const body = { linkedin_url: params.linkedin_url };
		const result = await pubrioRequest(getApiKey(), 'POST', '/companies/linkedin/lookup', body);
		return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
	},
);

// Lookup Job
server.tool(
	'lookup_job',
	'Look up detailed information about a specific job posting by its search ID',
	{
		job_search_id: z.string().describe('Pubrio job search ID'),
	},
	async (params) => {
		const body = { job_search_id: params.job_search_id };
		const result = await pubrioRequest(getApiKey(), 'POST', '/companies/jobs/lookup', body);
		return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
	},
);

// Lookup News
server.tool(
	'lookup_news',
	'Look up detailed information about a specific news article by its search ID',
	{
		news_search_id: z.string().describe('Pubrio news search ID'),
	},
	async (params) => {
		const body = { news_search_id: params.news_search_id };
		const result = await pubrioRequest(getApiKey(), 'POST', '/companies/news/lookup', body);
		return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
	},
);

// Lookup Advertisement
server.tool(
	'lookup_advertisement',
	'Look up detailed information about a specific advertisement by its search ID',
	{
		advertisement_search_id: z.string().describe('Pubrio advertisement search ID'),
	},
	async (params) => {
		const body = { advertisement_search_id: params.advertisement_search_id };
		const result = await pubrioRequest(getApiKey(), 'POST', '/companies/advertisements/lookup', body);
		return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
	},
);

// Lookup Lookalike
server.tool(
	'lookup_lookalike',
	'Look up a similar/lookalike company result by domain, LinkedIn URL, or domain search ID',
	{
		domain: z.string().optional().describe('Company domain (e.g. "google.com")'),
		linkedin_url: z.string().optional().describe('Company LinkedIn URL'),
		domain_search_id: z.string().optional().describe('Pubrio domain search ID'),
	},
	async (params) => {
		const body: Record<string, unknown> = {};
		if (params.domain) body.domain = params.domain;
		if (params.linkedin_url) body.linkedin_url = params.linkedin_url;
		if (params.domain_search_id) body.domain_search_id = params.domain_search_id;
		const result = await pubrioRequest(getApiKey(), 'POST', '/companies/lookalikes/lookup', body);
		return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
	},
);

// ── People (new) ───────────────────────────────────────────────────────

// Batch Redeem Contacts
server.tool(
	'batch_redeem_contacts',
	'Reveal contact details (email, phone) for multiple people at once (uses credits)',
	{
		peoples: z.string().describe('Comma-separated people_search_ids to redeem'),
		people_contact_types: z
			.string()
			.optional()
			.describe('Comma-separated contact types: email-personal, email-work, phone'),
	},
	async (params) => {
		const body: Record<string, unknown> = {
			peoples: splitComma(params.peoples),
		};
		if (params.people_contact_types) body.people_contact_types = splitComma(params.people_contact_types);
		const result = await pubrioRequest(getApiKey(), 'POST', '/redeem/people/batch', body);
		return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
	},
);

// Query Batch Redeem
server.tool(
	'query_batch_redeem',
	'Check the status and results of a batch contact redeem operation',
	{
		redeem_query_id: z.string().describe('Batch redeem query ID returned from batch_redeem_contacts'),
	},
	async (params) => {
		const body = { redeem_query_id: params.redeem_query_id };
		const result = await pubrioRequest(getApiKey(), 'POST', '/redeem/people/batch/query', body);
		return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
	},
);

// ── Filter / Reference Data (new) ─────────────────────────────────────

// Get Locations
server.tool(
	'get_locations',
	'Get the list of all available location codes for use as filter values in search queries',
	{},
	async () => {
		const result = await pubrioRequest(getApiKey(), 'GET', '/locations');
		return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
	},
);

// Get Departments
server.tool(
	'get_departments',
	'Get the list of all department title codes for use as filter values in people searches',
	{},
	async () => {
		const result = await pubrioRequest(getApiKey(), 'GET', '/departments/title');
		return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
	},
);

// Get Department Functions
server.tool(
	'get_department_functions',
	'Get the list of all department function codes for use as filter values in people searches',
	{},
	async () => {
		const result = await pubrioRequest(getApiKey(), 'GET', '/departments/function');
		return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
	},
);

// Get Management Levels
server.tool(
	'get_management_levels',
	'Get the list of all management/seniority level codes for use as filter values in people searches',
	{},
	async () => {
		const result = await pubrioRequest(getApiKey(), 'GET', '/management_levels');
		return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
	},
);

// Get Company Sizes
server.tool(
	'get_company_sizes',
	'Get the list of all company size range codes for use as filter values in searches',
	{},
	async () => {
		const result = await pubrioRequest(getApiKey(), 'GET', '/company_sizes');
		return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
	},
);

// Get Timezones
server.tool(
	'get_timezones',
	'Get the list of all available timezone codes',
	{},
	async () => {
		const result = await pubrioRequest(getApiKey(), 'GET', '/timezones');
		return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
	},
);

// Get News Categories
server.tool(
	'get_news_categories',
	'Get the list of all news category codes for use as filter values in news searches',
	{},
	async () => {
		const result = await pubrioRequest(getApiKey(), 'GET', '/companies/news/categories');
		return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
	},
);

// Get News Galleries
server.tool(
	'get_news_galleries',
	'Get the list of all news gallery codes for use as filter values in news searches',
	{},
	async () => {
		const result = await pubrioRequest(getApiKey(), 'GET', '/companies/news/galleries');
		return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
	},
);

// Get News Languages
server.tool(
	'get_news_languages',
	'Get the list of all news language codes for use as filter values in news searches',
	{},
	async () => {
		const result = await pubrioRequest(getApiKey(), 'GET', '/companies/news/languages');
		return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
	},
);

// Search Technologies
server.tool(
	'search_technologies',
	'Search for technology names by keyword to find valid technology filter values',
	{
		keyword: z.string().optional().describe('Keyword to search technologies'),
	},
	async (params) => {
		const body: Record<string, unknown> = {};
		if (params.keyword) body.keyword = params.keyword;
		const result = await pubrioRequest(getApiKey(), 'POST', '/technologies', body);
		return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
	},
);

// Search Technology Categories
server.tool(
	'search_technology_categories',
	'Search for technology category names by keyword to find valid technology category filter values',
	{
		keyword: z.string().optional().describe('Keyword to search technology categories'),
	},
	async (params) => {
		const body: Record<string, unknown> = {};
		if (params.keyword) body.keyword = params.keyword;
		const result = await pubrioRequest(getApiKey(), 'POST', '/technologies/categories', body);
		return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
	},
);

// Search Verticals
server.tool(
	'search_verticals',
	'Search for industry vertical names by keyword to find valid vertical filter values',
	{
		keyword: z.string().optional().describe('Keyword to search verticals'),
	},
	async (params) => {
		const body: Record<string, unknown> = {};
		if (params.keyword) body.keyword = params.keyword;
		const result = await pubrioRequest(getApiKey(), 'POST', '/verticals', body);
		return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
	},
);

// Search Vertical Categories
server.tool(
	'search_vertical_categories',
	'Search for vertical category names by keyword to find valid vertical category filter values',
	{
		keyword: z.string().optional().describe('Keyword to search vertical categories'),
	},
	async (params) => {
		const body: Record<string, unknown> = {};
		if (params.keyword) body.keyword = params.keyword;
		const result = await pubrioRequest(getApiKey(), 'POST', '/verticals/categories', body);
		return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
	},
);

// Search Vertical Sub-Categories
server.tool(
	'search_vertical_sub_categories',
	'Search for vertical sub-category names by keyword to find valid vertical sub-category filter values',
	{
		keyword: z.string().optional().describe('Keyword to search vertical sub-categories'),
	},
	async (params) => {
		const body: Record<string, unknown> = {};
		if (params.keyword) body.keyword = params.keyword;
		const result = await pubrioRequest(getApiKey(), 'POST', '/verticals/sub_categories', body);
		return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
	},
);

// ── Monitor (new) ─────────────────────────────────────────────────────

// Create Monitor
server.tool(
	'create_monitor',
	'Create a new signal monitor to track jobs, news, or advertisements for specified companies',
	{
		name: z.string().describe('Monitor name'),
		detection_mode: z.string().describe('Detection mode: "new" or "new_and_updated"'),
		signal_types: z.array(z.string()).describe('Signal types to monitor: "jobs", "news", "advertisements"'),
		destination_type: z.string().describe('Destination type: "webhook", "email", or "outreach_sequence"'),
		webhook_url: z.string().optional().describe('Webhook URL (required when destination_type is "webhook")'),
		email: z.string().optional().describe('Email address (required when destination_type is "email")'),
		sequence_identifier: z
			.string()
			.optional()
			.describe('Outreach sequence identifier (required when destination_type is "outreach_sequence")'),
		description: z.string().optional().describe('Monitor description'),
		frequency_minute: z.number().optional().describe('Check frequency in minutes'),
		max_daily_trigger: z.number().optional().describe('Maximum daily triggers'),
		max_records_per_trigger: z.number().optional().describe('Maximum records per trigger'),
		max_failure_trigger: z.number().optional().describe('Maximum failure triggers before pausing'),
		max_retry_per_trigger: z.number().optional().describe('Maximum retries per trigger'),
		retry_delay_second: z.number().optional().describe('Retry delay in seconds'),
		is_company_enrichment: z.boolean().optional().describe('Enable company enrichment on trigger'),
		is_people_enrichment: z.boolean().optional().describe('Enable people enrichment on trigger'),
		notification_email: z.string().optional().describe('Email for failure notifications'),
		companies: z.string().optional().describe('Comma-separated company UUIDs to monitor'),
		domains: z.string().optional().describe('Comma-separated company domains to monitor'),
		linkedin_urls: z.string().optional().describe('Comma-separated company LinkedIn URLs to monitor'),
	},
	async (params) => {
		const body: Record<string, unknown> = {
			name: params.name,
			detection_mode: params.detection_mode,
			signal_types: params.signal_types,
			destination_type: params.destination_type,
		};
		if (params.webhook_url) body.webhook_url = params.webhook_url;
		if (params.email) body.email = params.email;
		if (params.sequence_identifier) body.sequence_identifier = params.sequence_identifier;
		if (params.description) body.description = params.description;
		if (params.frequency_minute != null) body.frequency_minute = params.frequency_minute;
		if (params.max_daily_trigger != null) body.max_daily_trigger = params.max_daily_trigger;
		if (params.max_records_per_trigger != null) body.max_records_per_trigger = params.max_records_per_trigger;
		if (params.max_failure_trigger != null) body.max_failure_trigger = params.max_failure_trigger;
		if (params.max_retry_per_trigger != null) body.max_retry_per_trigger = params.max_retry_per_trigger;
		if (params.retry_delay_second != null) body.retry_delay_second = params.retry_delay_second;
		if (params.is_company_enrichment != null) body.is_company_enrichment = params.is_company_enrichment;
		if (params.is_people_enrichment != null) body.is_people_enrichment = params.is_people_enrichment;
		if (params.notification_email) body.notification_email = params.notification_email;
		if (params.companies) body.companies = splitComma(params.companies);
		if (params.domains) body.domains = splitComma(params.domains);
		if (params.linkedin_urls) body.linkedin_urls = splitComma(params.linkedin_urls);
		const result = await pubrioRequest(getApiKey(), 'POST', '/monitors/create', body);
		return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
	},
);

// Update Monitor
server.tool(
	'update_monitor',
	'Update an existing signal monitor configuration',
	{
		monitor_id: z.string().describe('Monitor UUID to update'),
		name: z.string().optional().describe('Monitor name'),
		description: z.string().optional().describe('Monitor description'),
		detection_mode: z.string().optional().describe('Detection mode: "new" or "new_and_updated"'),
		signal_types: z.array(z.string()).optional().describe('Signal types: "jobs", "news", "advertisements"'),
		frequency_minute: z.number().optional().describe('Check frequency in minutes'),
		max_daily_trigger: z.number().optional().describe('Maximum daily triggers'),
		max_records_per_trigger: z.number().optional().describe('Maximum records per trigger'),
		is_active: z.boolean().optional().describe('Whether the monitor is active'),
		is_paused: z.boolean().optional().describe('Whether the monitor is paused'),
		notification_email: z.string().optional().describe('Email for failure notifications'),
		companies: z.string().optional().describe('Comma-separated company UUIDs to monitor'),
		domains: z.string().optional().describe('Comma-separated company domains to monitor'),
		linkedin_urls: z.string().optional().describe('Comma-separated company LinkedIn URLs to monitor'),
	},
	async (params) => {
		const body: Record<string, unknown> = {
			monitor_id: params.monitor_id,
		};
		if (params.name) body.name = params.name;
		if (params.description) body.description = params.description;
		if (params.detection_mode) body.detection_mode = params.detection_mode;
		if (params.signal_types) body.signal_types = params.signal_types;
		if (params.frequency_minute != null) body.frequency_minute = params.frequency_minute;
		if (params.max_daily_trigger != null) body.max_daily_trigger = params.max_daily_trigger;
		if (params.max_records_per_trigger != null) body.max_records_per_trigger = params.max_records_per_trigger;
		if (params.is_active != null) body.is_active = params.is_active;
		if (params.is_paused != null) body.is_paused = params.is_paused;
		if (params.notification_email) body.notification_email = params.notification_email;
		if (params.companies) body.companies = splitComma(params.companies);
		if (params.domains) body.domains = splitComma(params.domains);
		if (params.linkedin_urls) body.linkedin_urls = splitComma(params.linkedin_urls);
		const result = await pubrioRequest(getApiKey(), 'POST', '/monitors/update', body);
		return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
	},
);

// Get Monitor
server.tool(
	'get_monitor',
	'Get detailed information about a specific signal monitor',
	{
		monitor_id: z.string().describe('Monitor UUID'),
		is_signature_reveal: z.boolean().optional().describe('Whether to reveal the webhook signature'),
	},
	async (params) => {
		const body: Record<string, unknown> = { monitor_id: params.monitor_id };
		if (params.is_signature_reveal != null) body.is_signature_reveal = params.is_signature_reveal;
		const result = await pubrioRequest(getApiKey(), 'POST', '/monitors/lookup', body);
		return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
	},
);

// List Monitors
server.tool(
	'list_monitors',
	'List all signal monitors with pagination and sorting',
	{
		page: z.number().optional().describe('Page number'),
		per_page: z.number().optional().describe('Results per page'),
		order_by: z.string().optional().describe('Sort field: "created_at", "last_modified", or "name"'),
		is_ascending_order: z.boolean().optional().describe('Sort in ascending order'),
	},
	async (params) => {
		const body: Record<string, unknown> = {};
		if (params.page != null) body.page = params.page;
		if (params.per_page != null) body.per_page = params.per_page;
		if (params.order_by) body.order_by = params.order_by;
		if (params.is_ascending_order != null) body.is_ascending_order = params.is_ascending_order;
		const result = await pubrioRequest(getApiKey(), 'POST', '/monitors', body);
		return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
	},
);

// Delete Monitor
server.tool(
	'delete_monitor',
	'Permanently delete a signal monitor',
	{
		monitor_id: z.string().describe('Monitor UUID to delete'),
	},
	async (params) => {
		const body = { monitor_id: params.monitor_id };
		const result = await pubrioRequest(getApiKey(), 'POST', '/monitors/delete', body);
		return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
	},
);

// Duplicate Monitor
server.tool(
	'duplicate_monitor',
	'Create a copy of an existing signal monitor with an optional new name',
	{
		monitor_id: z.string().describe('Monitor UUID to duplicate'),
		name: z.string().optional().describe('Name for the duplicated monitor'),
	},
	async (params) => {
		const body: Record<string, unknown> = { monitor_id: params.monitor_id };
		if (params.name) body.name = params.name;
		const result = await pubrioRequest(getApiKey(), 'POST', '/monitors/duplicate', body);
		return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
	},
);

// Test Run Monitor
server.tool(
	'test_run_monitor',
	'Execute a test run of a signal monitor to preview what it would trigger',
	{
		monitor_id: z.string().describe('Monitor UUID to test'),
		tried_at: z.string().optional().describe('ISO 8601 timestamp to simulate the run at'),
	},
	async (params) => {
		const body: Record<string, unknown> = { monitor_id: params.monitor_id };
		if (params.tried_at) body.tried_at = params.tried_at;
		const result = await pubrioRequest(getApiKey(), 'POST', '/monitors/process/try', body);
		return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
	},
);

// Retry Monitor
server.tool(
	'retry_monitor',
	'Retry a failed monitor trigger by log ID',
	{
		monitor_id: z.string().describe('Monitor UUID'),
		monitor_log_id: z.string().describe('Monitor log ID to retry'),
		is_use_original_destination: z
			.boolean()
			.optional()
			.describe('Whether to use the original destination configuration'),
	},
	async (params) => {
		const body: Record<string, unknown> = {
			monitor_id: params.monitor_id,
			monitor_log_id: params.monitor_log_id,
		};
		if (params.is_use_original_destination != null)
			body.is_use_original_destination = params.is_use_original_destination;
		const result = await pubrioRequest(getApiKey(), 'POST', '/monitors/process/retry', body);
		return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
	},
);

// Get Monitor Stats
server.tool(
	'get_monitor_stats',
	'Get aggregate statistics across all signal monitors',
	{},
	async () => {
		const result = await pubrioRequest(getApiKey(), 'POST', '/monitors/statistics');
		return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
	},
);

// Get Monitor Logs
server.tool(
	'get_monitor_logs',
	'Get trigger logs for a specific signal monitor with pagination',
	{
		monitor_id: z.string().describe('Monitor UUID'),
		page: z.number().optional().describe('Page number'),
		per_page: z.number().optional().describe('Results per page'),
	},
	async (params) => {
		const body: Record<string, unknown> = { monitor_id: params.monitor_id };
		if (params.page != null) body.page = params.page;
		if (params.per_page != null) body.per_page = params.per_page;
		const result = await pubrioRequest(getApiKey(), 'POST', '/monitors/statistics/logs', body);
		return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
	},
);

// ── Profile (new) ─────────────────────────────────────────────────────

// Get Profile
server.tool(
	'get_profile',
	'Get the full profile information for the authenticated Pubrio account',
	{},
	async () => {
		const result = await pubrioRequest(getApiKey(), 'POST', '/profile');
		return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
	},
);

async function main() {
	const transport = new StdioServerTransport();
	await server.connect(transport);
}

main().catch((error) => {
	console.error('Fatal error:', error);
	process.exit(1);
});
