export function placeAutocomplete(node: HTMLElement, onSelect: (lat: number, lng: number) => void) {
	let timeoutId: NodeJS.Timeout;

	const initAutocomplete = async () => {
		if (
			window.google &&
			window.google.maps &&
			typeof window.google.maps.importLibrary === 'function'
		) {
			const { PlaceAutocompleteElement } = await window.google.maps.importLibrary('places');

			const autocomplete = new PlaceAutocompleteElement({});

			const handleSelect = async (e: Event) => {
				const event = e as Event & {
					place?: google.maps.places.Place;
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					placePrediction?: any;
				};
				let place = event.place;
				if (!place && event.placePrediction) {
					place = event.placePrediction.toPlace();
				}

				if (!place) {
					return;
				}

				await place.fetchFields({ fields: ['location', 'displayName', 'formattedAddress'] });

				if (place.location) {
					onSelect(place.location.lat(), place.location.lng());
				}
			};

			autocomplete.addEventListener('gmp-placeselect', handleSelect);
			autocomplete.addEventListener('gmp-select', handleSelect);

			node.appendChild(autocomplete);
		} else {
			timeoutId = setTimeout(initAutocomplete, 100);
		}
	};

	initAutocomplete();

	return {
		destroy() {
			clearTimeout(timeoutId);
			node.innerHTML = '';
		}
	};
}
