type OutlayFunction = {
	allocatable?: boolean
	code: string
	commonUses: string[]
	description: string
	id: string
	name: string
	order: number
}

export const FUNCTIONS: OutlayFunction[] = [
	{
		code: '050',
		id: 'national_defense',
		name: 'National Defense',
		order: 1,
		description:
			'Funds the nation’s military forces and defense activities, including operations, readiness, weapons systems, and defense-related research.',
		commonUses: [
			'Military personnel pay and benefits',
			'Operations and maintenance (training, base operations, readiness)',
			'Procurement of aircraft, ships, vehicles, weapons, and equipment',
			'Research, development, test, and evaluation (RDT&E)',
			'Military construction and family housing',
			'Nuclear weapons activities (e.g., DOE/NNSA)',
			'Overseas contingency and deterrence initiatives (as enacted)',
		],
	},
	{
		code: '150',
		id: 'international_affairs',
		name: 'International Affairs',
		order: 2,
		description:
			'Funds U.S. diplomacy, foreign assistance, international development, and related global engagement and security cooperation.',
		commonUses: [
			'Diplomatic operations and embassies/consulates (State Department)',
			'Foreign economic and development assistance (USAID and partners)',
			'Humanitarian assistance and disaster response',
			'Global health programs (e.g., HIV/AIDS, malaria, maternal/child health)',
			'Security assistance and foreign military financing/training',
			'Contributions to international organizations and peacekeeping (as enacted)',
			'Public diplomacy and exchange programs',
		],
	},
	{
		code: '250',
		id: 'general_science_space_technology',
		name: 'General Science, Space, and Technology',
		order: 3,
		description:
			'Funds basic and applied research, space exploration, and federal science and technology programs not tied to a single mission area.',
		commonUses: [
			'Scientific research grants and national laboratories (e.g., NSF)',
			'Space exploration and science missions (NASA)',
			'Earth and space science research and data systems',
			'Technology development and innovation programs',
			'STEM research infrastructure and major facilities',
			'Aeronautics and advanced engineering R&D',
		],
	},
	{
		code: '270',
		id: 'energy',
		name: 'Energy',
		order: 4,
		description:
			'Funds programs related to energy production, regulation, efficiency, infrastructure, and energy-related research and security.',
		commonUses: [
			'Energy research, development, and demonstration (DOE)',
			'Grid reliability, transmission, and modernization initiatives',
			'Energy efficiency and renewable energy programs',
			'Strategic petroleum and energy supply security activities',
			'Energy-related regulatory activities (as applicable)',
			'Environmental cleanup and legacy energy site management (where classified here)',
		],
	},
	{
		code: '300',
		id: 'natural_resources_environment',
		name: 'Natural Resources and Environment',
		order: 5,
		description:
			'Funds conservation and management of public lands and resources, environmental protection, and related science and stewardship.',
		commonUses: [
			'National parks, forests, and public lands management (NPS/USFS/BLM)',
			'Fish and wildlife conservation and habitat restoration (FWS)',
			'Environmental protection and enforcement (EPA)',
			'Water resources science and management (USGS and related)',
			'Wildland fire management and suppression',
			'Pollution control, remediation, and environmental grants',
			'Coastal and ocean resource programs (where classified here)',
		],
	},
	{
		code: '350',
		id: 'agriculture',
		name: 'Agriculture',
		order: 6,
		description:
			'Funds farm and agricultural support programs, agricultural research, and nutrition and food safety activities classified under agriculture.',
		commonUses: [
			'Farm support and crop/commodity programs (USDA)',
			'Conservation programs on agricultural lands',
			'Agricultural research and extension services',
			'Food safety inspection and plant/animal health programs',
			'Rural development programs (where classified here)',
			'Nutrition assistance programs when included in this function (varies by classification)',
		],
	},
	{
		code: '370',
		id: 'commerce_housing_credit',
		name: 'Commerce and Housing Credit',
		order: 7,
		description:
			'Funds activities that support commerce and economic development and federal housing and credit programs (including certain loan and guarantee activities).',
		commonUses: [
			'Economic development and business support programs (Commerce and related)',
			'Trade promotion and commercial services',
			'Housing finance and credit-related assistance (where classified here)',
			'Federal loan and guarantee programs for housing and commerce (budgetary cost)',
			'Community development finance initiatives (where classified here)',
			'Financial institution oversight activities when grouped here (as applicable)',
		],
	},
	{
		code: '400',
		id: 'transportation',
		name: 'Transportation',
		order: 8,
		description:
			'Funds transportation infrastructure, safety, operations, and related programs across aviation, highways, transit, rail, and maritime modes.',
		commonUses: [
			'Highway and bridge programs',
			'Public transit capital and operating support (where applicable)',
			'Aviation safety and air traffic operations (FAA)',
			'Rail safety and infrastructure programs',
			'Maritime safety and port/waterway programs',
			'Transportation security initiatives (where classified here)',
		],
	},
	{
		code: '450',
		id: 'community_regional_development',
		name: 'Community and Regional Development',
		order: 9,
		description:
			'Funds place-based programs that support community development, housing and urban initiatives, regional planning, and disaster recovery.',
		commonUses: [
			'Community development block grants and local revitalization programs',
			'Affordable housing and homelessness assistance (where classified here)',
			'Economic adjustment and regional development programs',
			'Disaster recovery and mitigation grants (where classified here)',
			'Infrastructure and planning support for communities and regions',
		],
	},
	{
		code: '500',
		id: 'education_training_employment_social_services',
		name: 'Education, Training, Employment, and Social Services',
		order: 10,
		description:
			'Funds education programs and workforce development, job training, and social service supports aimed at improving opportunity and employment outcomes.',
		commonUses: [
			'K–12, higher education, and special education programs (as applicable)',
			'Student aid and grants (as applicable)',
			'Workforce training and employment services (e.g., job centers, apprenticeships)',
			'Unemployment services administration (not benefit payments unless classified here)',
			'Child care and family support services (where classified here)',
			'Community service and social service block grants',
		],
	},
	{
		code: '550',
		id: 'health',
		name: 'Health',
		order: 11,
		description:
			'Funds federal health programs other than Medicare, including public health, biomedical research, health services, and health coverage activities classified outside Medicare.',
		commonUses: [
			'Public health programs and preparedness/response (CDC and related)',
			'Biomedical and health research (NIH)',
			'Health services for specific populations (e.g., IHS, HRSA programs)',
			'Food and drug safety regulation (FDA, where classified here)',
			'Health coverage and subsidies not in Medicare (as classified)',
			'Substance use and mental health programs (SAMHSA and related)',
		],
	},
	{
		code: '570',
		id: 'medicare',
		name: 'Medicare',
		order: 12,
		description:
			'Funds the federal Medicare program—health insurance for eligible seniors and people with certain disabilities—including benefits and program administration.',
		commonUses: [
			'Medicare Part A (hospital insurance) benefit payments',
			'Medicare Part B (medical insurance) benefit payments',
			'Medicare Part D (prescription drug) benefits and subsidies',
			'Medicare Advantage (Part C) payments to plans',
			'Program integrity (fraud prevention) and administration',
			'Quality improvement and value-based payment initiatives',
		],
	},
	{
		code: '600',
		id: 'income_security',
		name: 'Income Security',
		order: 13,
		description:
			'Funds programs that provide financial assistance or safety-net support to individuals and families, excluding Social Security and Medicare.',
		commonUses: [
			'Supplemental Nutrition Assistance Program (SNAP) (where classified here)',
			'Temporary Assistance for Needy Families (TANF)',
			'Supplemental Security Income (SSI) (where classified here)',
			'Housing assistance (where classified here rather than 450)',
			'Earned income and child-related refundable credits (where classified as outlays)',
			'Child nutrition and related assistance (where classified here)',
		],
	},
	{
		code: '650',
		id: 'social_security',
		name: 'Social Security',
		order: 14,
		description:
			'Funds Social Security benefits and related administration, primarily retirement, disability, and survivors insurance payments.',
		commonUses: [
			'Old-Age and Survivors Insurance (OASI) benefit payments',
			'Disability Insurance (DI) benefit payments',
			'Social Security administrative costs (SSA operations)',
			'Program integrity and continuing disability reviews',
		],
	},
	{
		code: '700',
		id: 'veteran_benefits_services',
		name: 'Veterans Benefits and Services',
		order: 15,
		description:
			'Funds benefits and services for veterans, including health care, disability compensation, education benefits, and related support.',
		commonUses: [
			'VA medical care and hospital services',
			'Veterans disability compensation and pensions',
			'GI Bill and other education benefits',
			'VA housing loan programs (budgetary cost) and related services',
			'Veterans cemeteries and memorial affairs',
			'Transition assistance and employment support for veterans',
		],
	},
	{
		code: '750',
		id: 'administration_justice',
		name: 'Administration of Justice',
		order: 16,
		description:
			'Funds federal law enforcement, courts, corrections, immigration enforcement, and related justice and public safety activities.',
		commonUses: [
			'Federal law enforcement operations (FBI, DEA, ATF, Marshals, etc.)',
			'Federal courts and judicial administration',
			'Federal prisons and detention operations',
			'Immigration enforcement and detention (where classified here)',
			'Grants to state/local justice programs (where classified here)',
			'Cybercrime, intelligence, and investigative support programs',
		],
	},
	{
		code: '800',
		id: 'general_government',
		name: 'General Government',
		order: 17,
		description:
			'Funds general federal government operations not captured elsewhere, including legislative functions, executive management, tax administration, and central services.',
		commonUses: [
			'Tax administration (IRS) and revenue collection operations',
			'Treasury management activities (excluding net interest)',
			'Legislative branch operations (Congress support agencies)',
			'General services (federal buildings, procurement, IT services where classified here)',
			'Executive branch management and central administrative services',
			'Personnel management and government-wide oversight functions',
		],
	},
	{
		code: '900',
		id: 'net_interest',
		name: 'Net Interest',
		order: 97,
		allocatable: false,
		description:
			'Reflects the government’s interest costs on federal debt held by the public and intragovernmental holdings, net of interest received.',
		commonUses: [
			'Interest payments on Treasury securities (debt service)',
			'Netting of interest received by the government (as applicable)',
			'Accounting for interest costs tied to federal borrowing',
		],
	},
	{
		code: '920',
		id: 'allowances',
		name: 'Allowances',
		order: 98,
		allocatable: false,
		description:
			'Captures budget-wide allowances and adjustments that are not assigned to a single function (e.g., contingency or technical allowances).',
		commonUses: [
			'Government-wide contingency allowances (when used)',
			'Technical or economic assumption adjustments not distributed to functions',
			'Other cross-cutting allowances recorded centrally',
		],
	},
	{
		code: '950',
		id: 'undistributed_offsetting_receipts',
		name: 'Undistributed Offsetting Receipts',
		order: 99,
		allocatable: false,
		description:
			'Represents offsetting receipts (negative outlays) that are not assigned to specific spending functions, reducing total outlays.',
		commonUses: [
			'Employer contributions for federal employee retirement programs recorded as offsetting receipts',
			'Rents, royalties, and other receipts recorded centrally (when undistributed)',
			'Other collections that offset spending but are not allocated to functions',
		],
	},
	{
		code: 'TOTAL_OUTLAYS',
		id: 'total_outlays',
		name: 'Total Outlays',
		order: 100,
		allocatable: false,
		description:
			'The total amount of federal spending (outlays) across all functions for a given year.',
		commonUses: [
			'Top-line total for federal spending comparisons across years',
			'Denominator for calculating each function’s share of total outlays',
			'Budget summaries and high-level reporting',
		],
	},
]
