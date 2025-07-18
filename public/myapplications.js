document.addEventListener('DOMContentLoaded', () => {
    const myApplicationsList = document.getElementById('my-applications-list');
    const loadingMessage = document.getElementById('loading-message');
    const noApplicationsMessage = document.getElementById('no-applications-message');
    const messageBox = document.getElementById('message-box');
    const logoutButton = document.getElementById('logout-button-myapps');

    const applicationModal = document.getElementById('application-modal');
    const modalCloseButton = document.querySelector('.modal-close-button');
    const modalApplicantName = document.getElementById('modal-applicant-name');
    const modalDiscordId = document.getElementById('modal-discord-id');
    const modalAppType = document.getElementById('modal-app-type');
    const modalAnswers = document.getElementById('modal-answers');
    const modalStatus = document.getElementById('modal-status');
    const modalReviewerInfo = document.getElementById('modal-reviewer-info');
    const modalReviewDate = document.getElementById('modal-review-date');
    const modalReviewReasonContainer = document.getElementById('modal-review-reason-container');
    const modalReviewReasonInput = document.getElementById('modal-review-reason');


    function showMessage(message, type = 'info') {
        messageBox.textContent = message;
        messageBox.className = `mt-6 p-4 rounded-lg text-center ${type}`; 
        messageBox.style.display = 'block';

        setTimeout(() => {
            messageBox.style.display = 'none';
        }, 5000);
    }

    async function fetchSessionAndVerifyUser() {
        try {
            const response = await fetch('/api/session');
            if (!response.ok) {
                showMessage('Session expired. Please log in again.', 'error');
                setTimeout(() => { window.location.href = '/'; }, 2000);
                return false;
            }
            const data = await response.json();
            if (data.success && data.user && data.user.id) {
                return true;
            } else {
                showMessage('Unauthorized. Please log in to view your applications.', 'error');
                setTimeout(() => { window.location.href = '/'; }, 2000);
                return false;
            }
        } catch (error) {
            console.error('Error fetching session info:', error);
            showMessage('Network error or session issue. Please try logging in again.', 'error');
            setTimeout(() => { window.location.href = '/'; }, 2000);
            return false;
        }
    }

    function renderUserApplicationCard(app) {
        const appCard = document.createElement('div');
        appCard.className = 'bg-gray-700 p-6 rounded-lg shadow-md flex flex-col md:flex-row items-center justify-between cursor-pointer hover:bg-gray-600 transition duration-200';
        appCard.dataset.applicationId = app._id;

        const appInfo = document.createElement('div');
        appInfo.className = 'flex items-center mb-4 md:mb-0';
        const nameAndType = document.createElement('div');
        nameAndType.innerHTML = `<p class="text-xl font-semibold text-green-300">${app.applicationType.charAt(0).toUpperCase() + app.applicationType.slice(1)} Application</p><p class="text-gray-400 text-sm">Submitted: ${new Date(app.timestamp).toLocaleDateString()}</p>`;
        appInfo.appendChild(nameAndType);
        appCard.appendChild(appInfo);

        const statusInfo = document.createElement('div');
        statusInfo.className = 'flex items-center';
        const statusSpan = document.createElement('span');
        statusSpan.className = `px-3 py-1 rounded-full text-sm font-semibold ${
            app.status === 'pending' ? 'bg-yellow-500 text-yellow-900' :
            app.status === 'accepted' ? 'bg-green-500 text-green-900' :
            'bg-red-500 text-red-900'
        }`;
        statusSpan.textContent = app.status.charAt(0).toUpperCase() + app.status.slice(1);
        statusInfo.appendChild(statusSpan);
        appCard.appendChild(statusInfo);

        appCard.addEventListener('click', () => openApplicationModal(app));
        return appCard;
    }

    async function fetchMyApplications() {
        const isUserAuthenticated = await fetchSessionAndVerifyUser();
        if (!isUserAuthenticated) {
            loadingMessage.style.display = 'none';
            return;
        }

        loadingMessage.style.display = 'block';
        myApplicationsList.innerHTML = ''; 
        noApplicationsMessage.style.display = 'none';
        showMessage('', 'hidden'); 

        try {
            const response = await fetch('/api/my-applications');
            if (!response.ok) {
                if (response.status === 401) {
                    showMessage('Session expired. Please log in again.', 'error');
                    setTimeout(() => { window.location.href = '/'; }, 2000);
                }
                throw new Error('Failed to fetch your applications: ' + response.statusText);
            }
            const data = await response.json();

            loadingMessage.style.display = 'none';

            if (data.success && data.applications.length > 0) {
                data.applications.forEach(app => {
                    myApplicationsList.appendChild(renderUserApplicationCard(app));
                });
            } else {
                noApplicationsMessage.style.display = 'block';
            }
        } catch (error) {
            console.error('Error fetching user applications:', error);
            loadingMessage.style.display = 'none';
            showMessage('Failed to load your applications. Please try again.', 'error');
        }
    }

    function openApplicationModal(app) {
        modalApplicantName.textContent = app.username; 
        modalDiscordId.textContent = app.discordId;
        modalAppType.textContent = app.applicationType.charAt(0).toUpperCase() + app.applicationType.slice(1);
        modalStatus.textContent = `Status: ${app.status.charAt(0).toUpperCase() + app.status.slice(1)}`;
        modalStatus.className = `mt-4 text-right text-lg font-semibold ${
            app.status === 'pending' ? 'text-yellow-400' :
            app.status === 'accepted' ? 'text-green-400' :
            'text-red-400'
        }`;

        modalAnswers.innerHTML = '';
        for (const questionId in app.answers) {
            const answerDiv = document.createElement('div');
            answerDiv.className = 'bg-gray-700 p-3 rounded-md';
            const formattedQuestionId = questionId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            answerDiv.innerHTML = `<p class="font-semibold text-gray-300">${formattedQuestionId}:</p><p class="text-gray-200 whitespace-pre-wrap">${app.answers[questionId]}</p>`;
            modalAnswers.appendChild(answerDiv);
        }

        if (app.reviewedByUsername && app.reviewedByDiscordId && app.reviewTimestamp) {
            modalReviewerInfo.textContent = `Reviewed By: ${app.reviewedByUsername} (${app.reviewedByDiscordId})`;
            modalReviewDate.textContent = `Review Date: ${new Date(app.reviewTimestamp).toLocaleString()}`;
            modalReviewerInfo.style.display = 'block';
            modalReviewDate.style.display = 'block';
        } else {
            modalReviewerInfo.style.display = 'none';
            modalReviewDate.style.display = 'none';
            modalReviewerInfo.textContent = '';
            modalReviewDate.textContent = '';
        }

        if (app.reviewReason) {
            modalReviewReasonContainer.style.display = 'block';
            modalReviewReasonInput.value = app.reviewReason;
            modalReviewReasonInput.readOnly = true; 
            modalReviewReasonInput.classList.add('opacity-70', 'cursor-not-allowed');
        } else {
            modalReviewReasonContainer.style.display = 'none';
            modalReviewReasonInput.value = '';
        }

        applicationModal.classList.remove('hidden');
    }

    function closeApplicationModal() {
        applicationModal.classList.add('hidden');
    }

    modalCloseButton.addEventListener('click', closeApplicationModal);
    applicationModal.addEventListener('click', (e) => {
        if (e.target === applicationModal) {
            closeApplicationModal();
        }
    });

    logoutButton.addEventListener('click', async () => {
        try {
            const response = await fetch('/auth/logout');
            if (response.ok) {
                window.location.href = '/';
            } else {
                showMessage('Failed to log out. Please try again.', 'error');
            }
        } catch (error) {
            console.error('Error during logout:', error);
            showMessage('Network error during logout. Please try again.', 'error');
        }
    });

    fetchMyApplications();
});
