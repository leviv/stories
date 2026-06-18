interface AutocompleteOptions {
	onSelect: (lat: number, lng: number) => void;
	onError: () => void;
}

export function placeAutocomplete(node: HTMLElement, options: AutocompleteOptions) {
	let timeoutId: NodeJS.Timeout;
	let enterTimeout: NodeJS.Timeout;

	const initAutocomplete = async () => {
		if (
			window.google &&
			window.google.maps &&
			typeof window.google.maps.importLibrary === 'function'
		) {
			const { PlaceAutocompleteElement } = await window.google.maps.importLibrary('places');

			const autocomplete = new PlaceAutocompleteElement({});

			const handleSelect = async (e: Event) => {
				clearTimeout(enterTimeout);
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
					options.onError();
					return;
				}

				try {
					await place.fetchFields({ fields: ['location', 'displayName', 'formattedAddress'] });

					if (place.location) {
						options.onSelect(place.location.lat(), place.location.lng());
					} else {
						options.onError();
					}
				} catch (err) {
					options.onError();
				}
			};

			autocomplete.addEventListener('keydown', (e: Event) => {
				const keyboardEvent = e as KeyboardEvent;
				if (keyboardEvent.key === 'Enter') {
					clearTimeout(enterTimeout);
					enterTimeout = setTimeout(() => {
						options.onError();
					}, 150);
				}
			});

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
			clearTimeout(enterTimeout);
		}
	};
}
