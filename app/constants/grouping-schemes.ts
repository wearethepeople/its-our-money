export type GroupingScheme = {
	id: string
	label: string
	groups: { id: string; label: string; functionIds: string[] }[]
}

export type ViewSchemeId = 'flat' | 'public_domain'

export const FLAT_LIST_SCHEME: GroupingScheme = {
	id: 'flat',
	label: 'Straight List',
	groups: [],
}

export const PUBLIC_DOMAIN_SCHEME: GroupingScheme = {
	id: 'public_domain',
	label: 'Public Domain',
	groups: [
		{
			id: 'security_defense',
			label: 'Security & Defense',
			functionIds: [
				'national_defense',
				'international_affairs',
				'administration_justice',
			],
		},
		{
			id: 'veterans',
			label: 'Veterans',
			functionIds: ['veteran_benefits_services'],
		},
		{
			id: 'people_society',
			label: 'People & Society',
			functionIds: [
				'education_training_employment_social_services',
				'health',
				'medicare',
				'income_security',
				'social_security',
			],
		},
		{
			id: 'infrastructure_environment',
			label: 'Infrastructure & Environment',
			functionIds: [
				'energy',
				'natural_resources_environment',
				'agriculture',
				'transportation',
			],
		},
		{
			id: 'economy_development',
			label: 'Economy & Development',
			functionIds: ['commerce_housing_credit', 'community_regional_development'],
		},
		{
			id: 'innovation_research',
			label: 'Innovation & Research',
			functionIds: ['general_science_space_technology'],
		},
		{
			id: 'government_operations',
			label: 'Government Operations',
			functionIds: ['general_government', 'net_interest'],
		},
	],
}

export const SCHEMES = [FLAT_LIST_SCHEME, PUBLIC_DOMAIN_SCHEME] as const

export function getSchemeById(id: string): GroupingScheme {
	return SCHEMES.find((s) => s.id === id) ?? FLAT_LIST_SCHEME
}
