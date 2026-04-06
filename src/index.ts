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

async function main() {
	const transport = new StdioServerTransport();
	await server.connect(transport);
}

main().catch((error) => {
	console.error('Fatal error:', error);
	process.exit(1);
});
