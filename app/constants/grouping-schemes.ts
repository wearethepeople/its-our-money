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
			id: 'defense_veterans',
			label: 'Defense & Veterans',
			functionIds: [
				'national_defense',
				'international_affairs',
				'administration_justice',
				'veteran_benefits_services',
			],
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
			id: 'science_government',
			label: 'Science & Government',
			functionIds: ['general_science_space_technology', 'general_government'],
		},
	],
}

export const SCHEMES = [FLAT_LIST_SCHEME, PUBLIC_DOMAIN_SCHEME] as const

export function getSchemeById(id: string): GroupingScheme {
	return SCHEMES.find((s) => s.id === id) ?? FLAT_LIST_SCHEME
}
