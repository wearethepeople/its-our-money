import { href } from 'react-router'

export default function IndexRoute() {
	return (
		<div className="flex h-full grow flex-col items-start justify-center gap-8">
			<p>
				Money is personal.
				<br />
				You trade your time for it.
			</p>
			<p>
				A budget isn’t just numbers.
				<br />
				It’s a ledger of values.
			</p>
			<p>
				Uncle Sam collects your money all year.
				<br />
				You’ve never been asked where it should go.
			</p>
			<p>
				If you could decide… what would <em>you</em> choose?
			</p>
			<a href={href('/bridge')}>Begin</a>
		</div>
	)
}
