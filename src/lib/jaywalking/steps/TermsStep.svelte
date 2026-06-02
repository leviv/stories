<script lang="ts">
	export let termsLabel: () => string;
	export let onBack: () => void;
	export let onAgree: () => void;
</script>

<div class="screen terms">
	<div class="screen-card">
		<h1>Terms and Agreement</h1>
		<p class="timer">Required reading time: {termsLabel()}</p>
		<div class="terms-body">
			<p>
				By engaging with Jaywalking+, you acknowledge the ceremonial relevance of
				all user interactions, witnessed or otherwise, across each curated pathway.
			</p>
			<p>
				The participant affirms the continuity of presence, including any delays,
				pauses, or deviations that may arise from ambient factors or whimsical
				interference.
			</p>
			<p>
				All acknowledgments are binding, non-transferable, and subject to
				interpretation by the Committee of Daylight Navigation and Courtesy.
			</p>
			<p>
				Liability remains suspended during moments of quiet reflection, prolonged
				scrolling, or voluntary hesitation between clauses nine and twelve.
			</p>
			<p>
				The user agrees to maintain a respectful gaze toward all icons, banners,
				and notices, regardless of their perceived importance or ornamental intent.
			</p>
			<p>
				Any breach of timing rituals may result in ceremonial reminders, public
				disappointment, or gently worded admonitions placed near the sidebar.
			</p>
			<p>
				All disputes shall be resolved through interpretive dance, unless prior
				approval has been granted by the Office of Excessive Formalities.
			</p>
			<p>
				The agreement remains active until revoked by unanimous consent of the
				wind, or by a written decree delivered by carrier pigeon.
			</p>
			<p>
				Users must acknowledge the optional nature of optional clauses, while also
				committing to their importance in spirit and aesthetic.
			</p>
			<p>
				Continuation past this paragraph implies acceptance of the ceremonial
				structure, rhythm, and pacing defined herein.
			</p>
			<p>
				By proceeding, you affirm that you have dedicated the required time to
				understanding these terms, even if they remain delightfully abstract.
			</p>
		</div>
		<div class="screen-actions">
			<button class="ghost" type="button" onclick={onBack}>
				Back
			</button>
			<button class="primary" type="button" onclick={onAgree}>
				I Agree
			</button>
		</div>
	</div>
</div>
