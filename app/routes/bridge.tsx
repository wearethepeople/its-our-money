import { href } from 'react-router'

export default function BridgeRoute() {
	return (
		<div className="flex h-full grow flex-col items-start justify-center gap-8">
			<p>
				The federal budget divides money across priorities like defense,
				healthcare, and education.
			</p>
			<p>You don’t have to be an expert to have an opinion on what matters.</p>
			<p>
				Some spending is fixed, like your bills.
				<br />
				Some is flexible.
			</p>
			<p>
				This isn’t about drafting a federal budget.
				<br />
				It’s about what you would prioritize if{' '}
				<em>
					<strong>you</strong>
				</em>{' '}
				had a say.
			</p>
			<p>
				<a href={href('/allocate/:year', { year: '2026' })}>Continue</a>
			</p>
		</div>
	)
}
