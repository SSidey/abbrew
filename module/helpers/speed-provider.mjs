Hooks.once("dragRuler.ready", (SpeedProvider) => {
    class AbbrewSpeedProvider extends SpeedProvider {
        get colors() {
            return [
                {id: "walk", default: 0x00FF00, name: "abbrew.speeds.walk"},
                {id: "dash", default: 0xFFFF00, name: "abbrew.speeds.dash"},
                {id: "run", default: 0xFF8000, name: "abbrew.speeds.run"}
            ]
        }

        getRanges(token) {
            const baseSpeed = token.actor.data.speed

			// A character can always walk it's base speed and dash twice it's base speed
			const ranges = [
				{range: baseSpeed, color: "walk"},
				{range: baseSpeed * 2, color: "dash"}
			]

			// Characters that aren't wearing armor are allowed to run with three times their speed
			if (!token.actor.data.isWearingArmor) {
				ranges.push({range: baseSpeed * 3, color: "dash"})
			}

            return ranges
        }
    }

    dragRuler.registerModule("abbrew", AbbrewSpeedProvider)
})