/* Campaign Detail Page with API Integration */
(function () {
	const state = {
		campaign: null,
		donationAmount: 2000,
		tipPercent: 5,
		payMethod: 'card',
		likeCount: 0,
		liked: false,
		loading: false,
		shareUrl: ''
	};

	let pollInterval = null;

	function qs(id) { return document.getElementById(id); }

	function fmtMoney(value) {
		return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(value || 0));
	}

	function setText(id, value) {
		const el = qs(id);
		if (el) el.textContent = value;
	}

	function escapeHtml(text) {
		const div = document.createElement('div');
		div.appendChild(document.createTextNode(String(text || '')));
		return div.innerHTML;
	}

	function formatDate(dateStr) {
		if (!dateStr) return '';
		return new Date(dateStr).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
	}

	function showLoading(show) {
		const loader = qs('campaignLoader');
		if (loader) loader.style.display = show ? 'flex' : 'none';
		state.loading = !!show;
	}

	function updateProgressUI(raised, goal) {
		const pct = Number(goal) > 0 ? Math.min(100, Math.round((Number(raised) / Number(goal)) * 100)) : 0;
		setText('raisedDisplay', fmtMoney(raised));
		setText('goalDisplay', fmtMoney(goal));
		setText('progressPct', pct + '%');
		const fill = qs('progressFill');
		if (fill) fill.style.width = pct + '%';
	}

	async function loadCampaign() {
		try {
			showLoading(true);

			const params = new URLSearchParams(window.location.search);
			const campaignId = params.get('id') || sessionStorage.getItem('kb.selected.campaign.id');
			if (!campaignId) {
				ToastHelper.error('Campaign not found');
				setTimeout(function () { window.location.href = 'Landingpage.html'; }, 1500);
				return;
			}

			const response = await CampaignAPI.getById(campaignId);
			state.campaign = response.campaign;

			fillCampaignInfo();
			updateDonSummary();
			selectPayMethod('card');

			await Promise.all([loadDonationStats(), loadLikes(), loadComments()]);

			startPolling();
		} catch (error) {
			ToastHelper.error('Failed to load campaign: ' + error.message);
			setTimeout(function () { window.location.href = 'Landingpage.html'; }, 2000);
		} finally {
			showLoading(false);
		}
	}

	function fillCampaignInfo() {
		const campaign = state.campaign;
		if (!campaign) return;

		setText('heroTitle', campaign.title || 'Campaign');
		setText('heroDesc', campaign.description || '');
		setText('heroNgoName', campaign.ngoName || '');
		setText('successCampaign', campaign.title || 'Campaign');

		updateProgressUI(campaign.currentAmount || 0, campaign.targetAmount || 0);

		const daysLeft = campaign.endDate
			? Math.max(0, Math.ceil((new Date(campaign.endDate) - Date.now()) / 86400000))
			: null;
		const daysText = daysLeft !== null ? String(daysLeft) : 'TBD';
		setText('heroDaysLeft', daysText);
		setText('statDays', daysText);

		const shareUrl = window.location.origin + window.location.pathname + '?id=' + campaign.id;
		state.shareUrl = shareUrl;
		const shareLinkEl = qs('shareLinkInput');
		if (shareLinkEl) shareLinkEl.value = shareUrl;

		fillPayoutDetails();
	}

	function fillPayoutDetails() {
		const campaign = state.campaign;
		if (!campaign) return;
		setText('bankName', campaign.bankName || 'Not provided');
		setText('gcashAccount', campaign.gcashNumber || 'Not provided');
		setText('paymayaAccount', campaign.paymayaNumber || 'Not provided');
	}

	async function loadDonationStats() {
		if (!state.campaign) return;
		try {
			const response = await DonationAPI.getCampaignStats(state.campaign.id);
			const stats = response.stats;
			const count = Number(stats.totalDonations || 0);
			const raised = Number(stats.totalAmount || 0);
			const avg = count > 0 ? raised / count : 0;

			setText('heroDonorCount', count);
			setText('statDonors', count);
			setText('statAvg', fmtMoney(avg));
			updateProgressUI(raised, state.campaign.targetAmount || 0);
		} catch (error) {
			console.log('Failed to load donation stats:', error.message);
		}
	}

	async function loadLikes() {
		if (!state.campaign) return;
		try {
			const result = await CampaignAPI.getLikes(state.campaign.id);
			state.liked = result.liked || false;
			state.likeCount = result.likeCount || 0;
			qs('likeBtn') && qs('likeBtn').classList.toggle('active', state.liked);
			setText('likeTxt', state.liked ? 'Liked' : 'Like');
			setText('likeCount', '(' + state.likeCount + ')');
		} catch (error) {
			console.log('Failed to load likes:', error.message);
		}
	}

	async function loadComments() {
		if (!state.campaign) return;
		try {
			const result = await CampaignAPI.getComments(state.campaign.id);
			renderComments(result.comments || []);
		} catch (error) {
			console.log('Failed to load comments:', error.message);
		}
	}

	function renderComments(comments) {
		const list = qs('commentsList');
		const empty = qs('commentsEmpty');
		if (!list) return;
		if (!comments.length) {
			list.innerHTML = '';
			if (empty) empty.style.display = '';
			return;
		}
		if (empty) empty.style.display = 'none';
		list.innerHTML = comments.map(function (c) {
			return '<div class="comment-item" style="padding:10px 0;border-bottom:1px solid #f0f0f0;">'
				+ '<div style="display:flex;justify-content:space-between;margin-bottom:4px;">'
				+ '<span style="font-weight:600;font-size:13px;">' + escapeHtml(c.authorName) + '</span>'
				+ '<span style="font-size:12px;color:#888;">' + formatDate(c.createdAt) + '</span>'
				+ '</div>'
				+ '<p style="margin:0;font-size:14px;color:#333;">' + escapeHtml(c.text) + '</p>'
				+ '</div>';
		}).join('');
	}

	async function submitComment(event) {
		if (event) event.preventDefault();
		if (!AuthState.isAuthenticated) {
			qs('loginNotice') && qs('loginNotice').classList.add('open');
			return;
		}
		if (!state.campaign) return;
		const input = qs('commentInput');
		const text = String((input && input.value) || '').trim();
		if (!text) return;
		try {
			await CampaignAPI.addComment(state.campaign.id, text);
			if (input) input.value = '';
			setText('commentCharCount', '0/1000');
			await loadComments();
			ToastHelper.success && ToastHelper.success('Comment posted!');
		} catch (error) {
			ToastHelper.error('Failed to post comment: ' + error.message);
		}
	}

	function startPolling() {
		if (pollInterval) return;
		pollInterval = setInterval(function () {
			loadDonationStats();
		}, 30000);
	}

	function taxAmount(amount) { return amount * 0.01; }
	function tipAmount(amount, tipPct) { return amount * (tipPct / 100); }
	function totalAmount() {
		const donation = Number(state.donationAmount || 0);
		return donation + tipAmount(donation, state.tipPercent) + taxAmount(donation);
	}

	function updateDonSummary() {
		const input = qs('donAmtInput');
		const amt = Number((input && input.value) || 0);
		state.donationAmount = amt;

		const valid = amt >= 50;
		qs('donAmtErr') && qs('donAmtErr').classList.toggle('show', !valid);

		const tip = tipAmount(amt, state.tipPercent);
		const tax = taxAmount(amt);
		const total = amt + tip + tax;

		setText('sumDon', fmtMoney(amt));
		setText('sumTip', fmtMoney(tip));
		setText('sumTax', fmtMoney(tax));
		setText('sumTotal', fmtMoney(total));
		setText('gcashAmt', fmtMoney(total));
		setText('paymayaAmt', fmtMoney(total));
	}

	function selectPreset(button, amount) {
		document.querySelectorAll('.preset-btn').forEach(function (btn) { btn.classList.remove('active'); });
		if (button) button.classList.add('active');
		if (qs('donAmtInput')) qs('donAmtInput').value = String(amount);
		updateDonSummary();
	}

	function selectTip(button, percent) {
		document.querySelectorAll('.tip-btn').forEach(function (btn) { btn.classList.remove('active'); });
		if (button) button.classList.add('active');
		state.tipPercent = Number(percent || 0);

		const sumTipEl = qs('sumTip');
		if (sumTipEl) {
			const row = sumTipEl.closest('.summary-row');
			if (row) {
				const first = row.querySelector('span');
				if (first) first.textContent = 'Platform Tip (' + state.tipPercent + '%)';
			}
		}
		updateDonSummary();
	}

	function handleDonateClick() {
		openModal('donationModal');
	}

	function openModal(id) {
		if (id === 'donationModal' && !AuthState.isAuthenticated) {
			qs('loginNotice') && qs('loginNotice').classList.add('open');
			return;
		}
		qs(id) && qs(id).classList.add('open');
	}

	function closeModal(id) {
		qs(id) && qs(id).classList.remove('open');
	}

	function closeLoginNotice() {
		qs('loginNotice') && qs('loginNotice').classList.remove('open');
	}

	function goToPayment() {
		if (Number(state.donationAmount || 0) < 50) {
			qs('donAmtErr') && qs('donAmtErr').classList.add('show');
			return;
		}
		closeModal('donationModal');
		openModal('paymentModal');
	}

	async function processPayment() {
		if (!state.campaign) return;
		try {
			await DonationAPI.create({
				campaignId: state.campaign.id,
				amount: state.donationAmount,
				paymentMethod: state.payMethod,
				message: null
			});

			setText('successDon', fmtMoney(state.donationAmount));
			setText('successTip', fmtMoney(tipAmount(state.donationAmount, state.tipPercent)));
			setText('successTax', fmtMoney(taxAmount(state.donationAmount)));
			setText('successTotal', fmtMoney(totalAmount()));

			closeModal('paymentModal');
			openModal('successModal');

			setTimeout(loadDonationStats, 1000);
		} catch (error) {
			ToastHelper.error('Payment failed: ' + error.message);
		}
	}

	function selectPayMethod(method) {
		state.payMethod = method;
		['card', 'gcash', 'paymaya', 'bank_transfer'].forEach(function (m) {
			const btn = qs('pm-' + m);
			if (btn) btn.classList.toggle('active', m === method);
		});
		var fields = { card: 'cardFields', gcash: 'gcashFields', paymaya: 'paymayaFields', bank_transfer: 'bankFields' };
		Object.keys(fields).forEach(function (m) {
			var el = qs(fields[m]);
			if (el) el.style.display = m === method ? '' : 'none';
		});
	}

	async function toggleLike() {
		if (!AuthState.isAuthenticated) {
			qs('loginNotice') && qs('loginNotice').classList.add('open');
			return;
		}
		if (!state.campaign) return;
		try {
			const result = await CampaignAPI.toggleLike(state.campaign.id);
			state.liked = result.liked;
			state.likeCount = result.likeCount;
			qs('likeBtn') && qs('likeBtn').classList.toggle('active', state.liked);
			setText('likeTxt', state.liked ? 'Liked' : 'Like');
			setText('likeCount', '(' + state.likeCount + ')');
		} catch (error) {
			ToastHelper.error('Failed to update like.');
		}
	}

	function shareTo(platform) {
		const url = encodeURIComponent(state.shareUrl || window.location.href);
		const title = encodeURIComponent((state.campaign && state.campaign.title) || 'KapitBisig Campaign');
		let shareLink;
		if (platform === 'facebook') {
			shareLink = 'https://www.facebook.com/sharer/sharer.php?u=' + url;
		} else if (platform === 'twitter') {
			shareLink = 'https://twitter.com/intent/tweet?url=' + url + '&text=' + title;
		} else if (platform === 'viber') {
			shareLink = 'viber://forward?text=' + title + '%20' + url;
		}
		if (shareLink) window.open(shareLink, '_blank', 'noopener');
	}

	function copyLink() {
		const input = qs('shareLinkInput');
		if (!input) return;
		const text = input.value;
		if (navigator.clipboard && navigator.clipboard.writeText) {
			navigator.clipboard.writeText(text).then(function () {
				showToast('Link copied!');
			}).catch(function () {
				fallbackCopy(input);
			});
		} else {
			fallbackCopy(input);
		}
	}

	function fallbackCopy(input) {
		input.select();
		input.setSelectionRange(0, 99999);
		try { document.execCommand('copy'); } catch (_) {}
		showToast('Link copied!');
	}

	function showToast(msg) {
		setText('toastMsg', msg);
		const toast = qs('toast');
		if (toast) {
			toast.classList.add('show');
			setTimeout(function () { toast.classList.remove('show'); }, 3000);
		}
	}

	function submitReport() {
		const reason = qs('reportReason') && qs('reportReason').value;
		const details = String((qs('reportDetails') && qs('reportDetails').value) || '').trim();
		let valid = true;
		if (!reason) {
			qs('reportReasonErr') && qs('reportReasonErr').classList.add('show');
			valid = false;
		} else {
			qs('reportReasonErr') && qs('reportReasonErr').classList.remove('show');
		}
		if (details.length < 10) {
			qs('reportDetailsErr') && qs('reportDetailsErr').classList.add('show');
			valid = false;
		} else {
			qs('reportDetailsErr') && qs('reportDetailsErr').classList.remove('show');
		}
		if (!valid) return;
		if (qs('reportFormView')) qs('reportFormView').style.display = 'none';
		if (qs('reportConfirmView')) qs('reportConfirmView').style.display = '';
	}

	function resetReport() {
		if (qs('reportFormView')) qs('reportFormView').style.display = '';
		if (qs('reportConfirmView')) qs('reportConfirmView').style.display = 'none';
		if (qs('reportReason')) qs('reportReason').value = '';
		if (qs('reportDetails')) qs('reportDetails').value = '';
	}

	function formatCard(input) {
		const digits = String(input.value || '').replace(/\D/g, '').slice(0, 16);
		input.value = digits.replace(/(.{4})/g, '$1 ').trim();
	}

	function formatExpiry(input) {
		const digits = String(input.value || '').replace(/\D/g, '').slice(0, 4);
		input.value = digits.length > 2 ? digits.slice(0, 2) + ' / ' + digits.slice(2) : digits;
	}

	function initDrawer() {
		const drawer = qs('navDrawer');
		const hamburger = qs('hamburger');
		if (!drawer || !hamburger) return;
		hamburger.addEventListener('click', function () {
			const open = !drawer.classList.contains('open');
			drawer.classList.toggle('open', open);
			hamburger.classList.toggle('open', open);
		});
	}

	function initCommentCharCount() {
		const input = qs('commentInput');
		const counter = qs('commentCharCount');
		if (!input || !counter) return;
		input.addEventListener('input', function () {
			counter.textContent = input.value.length + '/1000';
		});
	}

	function init() {
		initDrawer();
		initCommentCharCount();
		loadCampaign();
	}

	window.openModal = openModal;
	window.closeModal = closeModal;
	window.handleDonateClick = handleDonateClick;
	window.closeLoginNotice = closeLoginNotice;
	window.selectPreset = selectPreset;
	window.selectTip = selectTip;
	window.updateDonSummary = updateDonSummary;
	window.goToPayment = goToPayment;
	window.processPayment = processPayment;
	window.selectPayMethod = selectPayMethod;
	window.toggleLike = toggleLike;
	window.shareTo = shareTo;
	window.copyLink = copyLink;
	window.submitReport = submitReport;
	window.resetReport = resetReport;
	window.submitComment = submitComment;
	window.formatCard = formatCard;
	window.formatExpiry = formatExpiry;

	document.addEventListener('DOMContentLoaded', init);
})();
