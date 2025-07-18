document.addEventListener('DOMContentLoaded', () => {
    const applicationsList = document.getElementById('applications-list');
    const loadingMessage = document.getElementById('loading-message');
    const noApplicationsMessage = document.getElementById('no-applications-message');
    const messageBox = document.getElementById('message-box')
    const logoutButton = document.getElementById('logout-button-admin');

    const mainAdminTitle = document.getElementById('main-admin-title');
    const sectionTitle = document.getElementById('section-title');
    const sectionDescription = document.getElementById('section-description');

    const applicationSearchInput = document.getElementById('application-search-input');
    const searchButton = document.getElementById('search-button');

    const showApplicationsBtn = document.getElementById('show-applications-btn');
    const showModeratorsBtn = document.getElementById('show-moderators-btn');
    const showAdminsBtn = document.getElementById('show-admins-btn');
    const showBlacklistBtn = document.getElementById('show-blacklist-btn');
    const applicationsSection = document.getElementById('applications-section');
    const moderatorsSection = document.getElementById('moderators-section');
    const adminsSection = document.getElementById('admins-section');
    const blacklistSection = document.getElementById('blacklist-section');

    const addAdminIdInput = document.getElementById('add-admin-id');
    const addAdminUsernameInput = document.getElementById('add-admin-username');
    const addAdminBtn = document.getElementById('add-admin-btn');
    const adminsList = document.getElementById('admins-list');

    const addModeratorIdInput = document.getElementById('add-moderator-id');
    const addModeratorUsernameInput = document.getElementById('add-moderator-username');
    const addModeratorBtn = document.getElementById('add-moderator-btn');
    const moderatorsList = document.getElementById('moderators-list');

    const addBlacklistIdInput = document.getElementById('add-blacklist-id');
    const addBlacklistUsernameInput = document.getElementById('add-blacklist-username');
    const addBlacklistReasonInput = document.getElementById('add-blacklist-reason');
    const addBlacklistBtn = document.getElementById('add-blacklist-btn');
    const blacklistList = document.getElementById('blacklist-list');

    const applicationModal = document.getElementById('application-modal');
    const modalCloseButton = document.querySelector('.modal-close-button');
    const modalApplicantName = document.getElementById('modal-applicant-name');
    const modalDiscordId = document.getElementById('modal-discord-id');
    const modalAppType = document.getElementById('modal-app-type');
    const modalAnswers = document.getElementById('modal-answers');
    const acceptButton = document.getElementById('accept-button');
    const rejectButton = document.getElementById('reject-button');
    const deleteButton = document.getElementById('delete-button');
    const modalStatus = document.getElementById('modal-status');
    const modalReviewerInfo = document.getElementById('modal-reviewer-info');
    const modalReviewDate = document.getElementById('modal-review-date');
    const modalReviewReasonContainer = document.getElementById('modal-review-reason-container');
    const modalReviewReasonInput = document.getElementById('modal-review-reason');

    const customConfirmModal = document.getElementById('custom-confirm-modal');
    const customConfirmMessage = document.getElementById('custom-confirm-message');
    const customConfirmYesBtn = document.getElementById('custom-confirm-yes');
    const customConfirmNoBtn = document.getElementById('custom-confirm-no');

    const notificationContainer = document.getElementById('notification-container');


    let currentApplicationId = null;
    let currentUserIsAdmin = false; 
    let currentUserIsModerator = false; 

    function showMessage(message, type = 'info') {
        messageBox.textContent = message;
        messageBox.className = `mt-6 p-4 rounded-lg text-center ${type}`; 
        messageBox.style.display = 'block';

        setTimeout(() => {
            messageBox.style.display = 'none';
        }, 5000);
    }

    function showNotification(message, type = 'success', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `p-4 rounded-lg shadow-lg text-white text-sm animate-slide-in-right transition-transform duration-500 ease-out transform translate-x-full`;

        if (type === 'success') {
            notification.classList.add('bg-green-600');
        } else if (type === 'error') {
            notification.classList.add('bg-red-600');
        } else if (type === 'info') {
            notification.classList.add('bg-blue-600');
        }

        notification.textContent = message;
        notificationContainer.appendChild(notification);

        requestAnimationFrame(() => {
            notification.style.transform = 'translateX(0)';
            notification.style.opacity = '1';
        });

        setTimeout(() => {
            notification.classList.add('animate-slide-out-right');
            notification.addEventListener('animationend', () => {
                notification.remove();
            }, { once: true });
        }, duration);
    }


    function customConfirm(message) {
        return new Promise((resolve) => {
            customConfirmMessage.textContent = message;
            customConfirmModal.classList.remove('hidden');

            const onYes = () => {
                customConfirmModal.classList.add('hidden');
                customConfirmYesBtn.removeEventListener('click', onYes);
                customConfirmNoBtn.removeEventListener('click', onNo);
                resolve(true);
            };

            const onNo = () => {
                customConfirmModal.classList.add('hidden');
                customConfirmYesBtn.removeEventListener('click', onYes);
                customConfirmNoBtn.removeEventListener('click', onNo);
                resolve(false);
            };

            customConfirmYesBtn.addEventListener('click', onYes);
            customConfirmNoBtn.addEventListener('click', onNo);

            customConfirmModal.addEventListener('click', (e) => {
                if (e.target === customConfirmModal) {
                    onNo(); 
                }
            }, { once: true });
        });
    }


    async function fetchSessionAndVerifyRoles() {
        try {
            const response = await fetch('/api/session');
            if (!response.ok) {
                showMessage('Session expired. Please log in again.', 'error');
                setTimeout(() => { window.location.href = '/'; }, 2000);
                return false;
            }
            const data = await response.json();
            if (data.success && data.user) {
                currentUserIsAdmin = data.user.isAdmin;
                currentUserIsModerator = data.user.isModerator;

                if (currentUserIsAdmin) {
                    mainAdminTitle.textContent = 'Admin Hub';
                } else if (currentUserIsModerator) {
                    mainAdminTitle.textContent = 'Moderator Hub';
                } else {
                    showMessage('Access denied. You are not authorized to view this page.', 'error');
                    setTimeout(() => { window.location.href = '/apply.html'; }, 2000);
                    return false;
                }

                if (!currentUserIsAdmin) {
                    showAdminsBtn.style.display = 'none';
                    showBlacklistBtn.style.display = 'none';
                    showModeratorsBtn.style.display = 'none'; 
                } else {
                    showAdminsBtn.style.display = 'inline-block';
                    showBlacklistBtn.style.display = 'inline-block';
                    showModeratorsBtn.style.display = 'inline-block';
                }
                return true;
            } else {
                showMessage('Access denied. You are not authorized to view this page.', 'error');
                setTimeout(() => { window.location.href = '/apply.html'; }, 2000);
                return false;
            }
        } catch (error) {
            console.error('Error fetching session info:', error);
            showMessage('Network error or session issue. Please try logging in again.', 'error');
            setTimeout(() => { window.location.href = '/'; }, 2000);
            return false;
        }
    }

    function showSection(sectionId) {
        applicationsSection.classList.add('hidden');
        moderatorsSection.classList.add('hidden');
        adminsSection.classList.add('hidden');
        blacklistSection.classList.add('hidden');

        showApplicationsBtn.classList.remove('bg-green-700', 'hover:bg-green-600');
        showApplicationsBtn.classList.add('bg-gray-700', 'hover:bg-gray-600');
        showModeratorsBtn.classList.remove('bg-green-700', 'hover:bg-green-600');
        showModeratorsBtn.classList.add('bg-gray-700', 'hover:bg-gray-600');
        showAdminsBtn.classList.remove('bg-green-700', 'hover:bg-green-600');
        showAdminsBtn.classList.add('bg-gray-700', 'hover:bg-gray-600');
        showBlacklistBtn.classList.remove('bg-green-700', 'hover:bg-green-600');
        showBlacklistBtn.classList.add('bg-gray-700', 'hover:bg-gray-600');

        let titleText = '';
        let descriptionText = '';

        switch (sectionId) {
            case 'applications':
                applicationsSection.classList.remove('hidden');
                showApplicationsBtn.classList.add('bg-green-700', 'hover:bg-green-600');
                showApplicationsBtn.classList.remove('bg-gray-700', 'hover:bg-gray-600');
                titleText = 'Pending Applications';
                descriptionText = 'Review applications that are awaiting a decision.';
                fetchApplications(); 
                break;
            case 'moderators':
                if (!currentUserIsAdmin) {
                    showMessage('Access denied. Only administrators can manage moderators.', 'error');
                    showSection('applications');
                    return;
                }
                moderatorsSection.classList.remove('hidden');
                showModeratorsBtn.classList.add('bg-green-700', 'hover:bg-green-600');
                showModeratorsBtn.classList.remove('bg-gray-700', 'hover:bg-gray-600');
                titleText = 'Manage Moderators';
                descriptionText = 'Add or remove users with moderator (view-only) permissions.';
                fetchModerators();
                break;
            case 'admins':
                if (!currentUserIsAdmin) {
                    showMessage('Access denied. Only administrators can manage admins.', 'error');
                    showSection('applications');
                    return;
                }
                adminsSection.classList.remove('hidden');
                showAdminsBtn.classList.add('bg-green-700', 'hover:bg-green-600');
                showAdminsBtn.classList.remove('bg-gray-700', 'hover:bg-gray-600');
                titleText = 'Manage Administrators';
                descriptionText = 'Add or remove users with full administrative control.';
                fetchAdmins();
                break;
            case 'blacklist':
                if (!currentUserIsAdmin) {
                    showMessage('Access denied. Only administrators can manage the blacklist.', 'error');
                    showSection('applications');
                    return;
                }
                blacklistSection.classList.remove('hidden');
                showBlacklistBtn.classList.add('bg-green-700', 'hover:bg-green-600');
                showBlacklistBtn.classList.remove('bg-gray-700', 'hover:bg-gray-600');
                titleText = 'Manage Blacklist';
                descriptionText = 'Add or remove users from the application submission blacklist.';
                fetchBlacklistedUsers();
                break;
        }
        sectionTitle.textContent = titleText;
        sectionDescription.textContent = descriptionText;
    }

    function renderApplicationCard(app) {
        const appCard = document.createElement('div');
        appCard.className = 'bg-gray-700 p-6 rounded-lg shadow-md flex flex-col md:flex-row items-center justify-between cursor-pointer hover:bg-gray-600 transition duration-200';
        appCard.dataset.applicationId = app._id; 

        const userInfo = document.createElement('div');
        userInfo.className = 'flex items-center mb-4 md:mb-0';
        if (app.avatar) {
            const avatarImg = document.createElement('img');
            avatarImg.src = app.avatar;
            avatarImg.alt = `${app.username}'s avatar`;
            avatarImg.className = 'w-12 h-12 rounded-full mr-4 border-2 border-green-500';
            userInfo.appendChild(avatarImg);
        }
        const nameAndType = document.createElement('div');
        nameAndType.innerHTML = `<p class="text-xl font-semibold text-green-300">${app.username}</p><p class="text-gray-400 text-sm">${app.applicationType.charAt(0).toUpperCase() + app.applicationType.slice(1)} Application</p>`;
        userInfo.appendChild(nameAndType);
        appCard.appendChild(userInfo);

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

    async function fetchApplications(applicationId = null) {
        const hasAccess = await fetchSessionAndVerifyRoles(); 
        if (!hasAccess) {
            loadingMessage.style.display = 'none';
            return;
        }

        loadingMessage.style.display = 'block';
        applicationsList.innerHTML = ''; 
        noApplicationsMessage.style.display = 'none';
        showMessage('', 'hidden'); 

        let url = '/api/applications'; 
        if (applicationId) {
            url = `/api/applications/${applicationId}`; 
        }

        try {
            const response = await fetch(url);
            if (!response.ok) {
                if (response.status === 404 && applicationId) {
                    showMessage(`Application with ID "${applicationId}" not found.`, 'error');
                } else if (response.status === 400 && applicationId) {
                    showMessage('Invalid application ID format.', 'error');
                } else if (response.status === 403) {
                    showMessage('Access denied. You are not authorized to view this page.', 'error');
                    setTimeout(() => { window.location.href = '/apply.html'; }, 2000);
                } else if (response.status === 401) {
                    showMessage('Session expired. Please log in again.', 'error');
                    setTimeout(() => { window.location.href = '/'; }, 2000);
                }
                throw new Error('Failed to fetch applications: ' + response.statusText);
            }
            const data = await response.json();

            loadingMessage.style.display = 'none';

            if (data.success) {
                let appsToDisplay = [];
                if (applicationId) {
                    if (data.application) {
                        appsToDisplay.push(data.application);
                        openApplicationModal(data.application);
                    }
                } else { 
                    appsToDisplay = data.applications;
                }

                if (appsToDisplay.length > 0) {
                    appsToDisplay.forEach(app => {
                        applicationsList.appendChild(renderApplicationCard(app));
                    });
                } else {
                    noApplicationsMessage.style.display = 'block';
                }
            } else {
                showMessage(`Failed to load applications: ${data.message || 'Unknown error.'}`, 'error');
            }
        } catch (error) {
            console.error('Error fetching applications:', error);
            loadingMessage.style.display = 'none';
            if (!applicationId || (error.message && !error.message.includes('not found') && !error.message.includes('Invalid application ID'))) {
                 showMessage('Failed to load applications. Please try again.', 'error');
            }
        }
    }

    function openApplicationModal(app) {
        currentApplicationId = app._id;
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

        if (app.status === 'pending' && currentUserIsAdmin) { 
            modalReviewReasonContainer.style.display = 'block';
            modalReviewReasonInput.value = app.reviewReason || ''; 
            modalReviewReasonInput.readOnly = false; 
            modalReviewReasonInput.classList.remove('opacity-70', 'cursor-not-allowed');
        } else if (app.reviewReason) {
            modalReviewReasonContainer.style.display = 'block';
            modalReviewReasonInput.value = app.reviewReason;
            modalReviewReasonInput.readOnly = true; 
            modalReviewReasonInput.classList.add('opacity-70', 'cursor-not-allowed');
        } else { 
            modalReviewReasonContainer.style.display = 'none';
            modalReviewReasonInput.value = '';
        }

        acceptButton.disabled = (app.status !== 'pending' || !currentUserIsAdmin);
        rejectButton.disabled = (app.status !== 'pending' || !currentUserIsAdmin);
        deleteButton.disabled = !currentUserIsAdmin; 

        applicationModal.classList.remove('hidden');
    }

    function closeApplicationModal() {
        applicationModal.classList.add('hidden');
        currentApplicationId = null;
        modalReviewReasonInput.value = ''; 
    }

    async function updateApplicationStatus(status) {
        if (!currentApplicationId) {
            console.error('No application ID set for status update.');
            showMessage('Error: No application selected.', 'error');
            return;
        }
        if (!currentUserIsAdmin) { 
            showNotification('You do not have permission to accept or reject applications.', 'error');
            return;
        }

        const reviewReason = modalReviewReasonInput.value.trim();

        const confirmAction = await customConfirm(`Are you sure you want to ${status} this application?`);
        if (!confirmAction) {
            return; 
        }

        acceptButton.disabled = true;
        rejectButton.disabled = true;
        deleteButton.disabled = true;
        showNotification(`Updating status to ${status}...`, 'info');

        try {
            const response = await fetch(`/api/applications/${currentApplicationId}/status`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: status, reviewReason: reviewReason }),
            });

            const result = await response.json();

            if (response.ok && result.success) {
                showNotification(`Application status updated to ${status}.`, 'success');
                closeApplicationModal();
                fetchApplications(); 
            } else {
                showNotification(`Failed to update status: ${result.message || 'Unknown error.'}`, 'error');
            }
        } catch (error) {
                console.error('Error updating application status:', error);
                showNotification('Network error while updating status. Please try again.', 'error');
        } finally {
            acceptButton.disabled = false;
            rejectButton.disabled = false;
            deleteButton.disabled = false;
        }
    }

    async function deleteApplication() {
        if (!currentApplicationId) {
            console.error('No application ID set for deletion.');
            showMessage('Error: No application selected.', 'error');
            return;
        }
        if (!currentUserIsAdmin) { 
            showNotification('You do not have permission to delete applications.', 'error');
            return;
        }

        const confirmDelete = await customConfirm('Are you sure you want to delete this application? This action cannot be undone.');
        if (!confirmDelete) {
            return; 
        }

        acceptButton.disabled = true;
        rejectButton.disabled = true;
        deleteButton.disabled = true;
        showNotification('Deleting application...', 'info');

        try {
            const response = await fetch(`/api/applications/${currentApplicationId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const result = await response.json();

            if (response.ok && result.success) {
                showNotification('Application deleted successfully!', 'success');
                closeApplicationModal();
                fetchApplications(); 
            } else {
                showNotification(`Failed to delete application: ${result.message || 'Unknown error.'}`, 'error');
            }
        } catch (error) {
            console.error('Error deleting application:', error);
            showNotification('Network error while deleting application. Please try again.', 'error');
        } finally {
            acceptButton.disabled = false;
            rejectButton.disabled = false;
            deleteButton.disabled = false;
        }
    }

    async function fetchAdmins() {
        adminsList.innerHTML = '<p class="text-gray-400 text-center">Loading admins...</p>';
        try {
            const response = await fetch('/api/admins');
            if (!response.ok) {
                throw new Error('Failed to fetch admins: ' + response.statusText);
            }
            const data = await response.json();
            if (data.success && data.admins.length > 0) {
                adminsList.innerHTML = ''; 
                data.admins.forEach(admin => {
                    adminsList.appendChild(renderAdminCard(admin));
                });
            } else {
                adminsList.innerHTML = '<p class="text-gray-400 text-center">No admins found.</p>';
            }
        } catch (error) {
            console.error('Error fetching admins:', error);
            showNotification('Failed to load admins. Please try again.', 'error');
            adminsList.innerHTML = '<p class="text-red-400 text-center">Error loading admins.</p>';
        }
    }

    function renderAdminCard(admin) {
        const adminCard = document.createElement('div');
        adminCard.className = 'bg-gray-700 p-4 rounded-lg shadow-md flex items-center justify-between';
        adminCard.innerHTML = `
            <div>
                <p class="text-lg font-semibold text-green-300">${admin.username}</p>
                <p class="text-gray-400 text-sm">ID: ${admin.discordId}</p>
                ${admin.addedByUsername ? `<p class="text-gray-500 text-xs">Added by: ${admin.addedByUsername}</p>` : ''}
            </div>
            <button class="remove-admin-btn bg-red-600 hover:bg-red-700 text-white font-semibold py-1.5 px-4 rounded-full text-sm transition duration-300 ease-in-out" data-discord-id="${admin.discordId}">Remove</button>
        `;
        adminCard.querySelector('.remove-admin-btn').addEventListener('click', async (e) => {
            const discordIdToRemove = e.target.dataset.discordId;
            const confirmRemove = await customConfirm(`Are you sure you want to remove admin ${discordIdToRemove}?`);
            if (confirmRemove) {
                removeAdmin(discordIdToRemove);
            }
        });
        return adminCard;
    }

    async function addAdmin() {
        const discordId = addAdminIdInput.value.trim();
        const username = addAdminUsernameInput.value.trim();

        if (!discordId || !username) {
            showNotification('Discord ID and Username are required to add an admin.', 'error');
            return;
        }

        addAdminBtn.disabled = true;
        showNotification('Adding admin...', 'info');

        try {
            const response = await fetch('/api/admins', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ discordId, username })
            });
            const result = await response.json();

            if (response.ok && result.success) {
                showNotification('Admin added successfully!', 'success');
                addAdminIdInput.value = '';
                addAdminUsernameInput.value = '';
                fetchAdmins(); 
            } else {
                showNotification(`Failed to add admin: ${result.message || 'Unknown error.'}`, 'error');
            }
        } catch (error) {
            console.error('Error adding admin:', error);
            showNotification('Network error while adding admin. Please try again.', 'error');
        } finally {
            addAdminBtn.disabled = false;
        }
    }

    async function removeAdmin(discordId) {
        showNotification('Removing admin...', 'info');
        try {
            const response = await fetch(`/api/admins/${discordId}`, {
                method: 'DELETE'
            });
            const result = await response.json();

            if (response.ok && result.success) {
                showNotification('Admin removed successfully!', 'success');
                fetchAdmins(); 
            } else {
                showNotification(`Failed to remove admin: ${result.message || 'Unknown error.'}`, 'error');
            }
        } catch (error) {
            console.error('Error removing admin:', error);
            showNotification('Network error while removing admin. Please try again.', 'error');
        }
    }

    async function fetchModerators() {
        moderatorsList.innerHTML = '<p class="text-gray-400 text-center">Loading moderators...</p>';
        try {
            const response = await fetch('/api/moderators');
            if (!response.ok) {
                throw new Error('Failed to fetch moderators: ' + response.statusText);
            }
            const data = await response.json();
            if (data.success && data.moderators.length > 0) {
                moderatorsList.innerHTML = ''; 
                data.moderators.forEach(moderator => {
                    moderatorsList.appendChild(renderModeratorCard(moderator));
                });
            } else {
                moderatorsList.innerHTML = '<p class="text-gray-400 text-center">No moderators found.</p>';
            }
        } catch (error) {
            console.error('Error fetching moderators:', error);
            showNotification('Failed to load moderators. Please try again.', 'error');
            moderatorsList.innerHTML = '<p class="text-red-400 text-center">Error loading moderators.</p>';
        }
    }

    function renderModeratorCard(moderator) {
        const moderatorCard = document.createElement('div');
        moderatorCard.className = 'bg-gray-700 p-4 rounded-lg shadow-md flex items-center justify-between';
        moderatorCard.innerHTML = `
            <div>
                <p class="text-lg font-semibold text-blue-300">${moderator.username}</p>
                <p class="text-gray-400 text-sm">ID: ${moderator.discordId}</p>
                ${moderator.addedByUsername ? `<p class="text-gray-500 text-xs">Added by: ${moderator.addedByUsername}</p>` : ''}
            </div>
            <button class="remove-moderator-btn bg-red-600 hover:bg-red-700 text-white font-semibold py-1.5 px-4 rounded-full text-sm transition duration-300 ease-in-out" data-discord-id="${moderator.discordId}">Remove</button>
        `;
        moderatorCard.querySelector('.remove-moderator-btn').addEventListener('click', async (e) => {
            const discordIdToRemove = e.target.dataset.discordId;
            const confirmRemove = await customConfirm(`Are you sure you want to remove moderator ${discordIdToRemove}?`);
            if (confirmRemove) {
                removeModerator(discordIdToRemove);
            }
        });
        return moderatorCard;
    }

    async function addModerator() {
        const discordId = addModeratorIdInput.value.trim();
        const username = addModeratorUsernameInput.value.trim();

        if (!discordId || !username) {
            showNotification('Discord ID and Username are required to add a moderator.', 'error');
            return;
        }

        addModeratorBtn.disabled = true;
        showNotification('Adding moderator...', 'info');

        try {
            const response = await fetch('/api/moderators', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ discordId, username })
            });
            const result = await response.json();

            if (response.ok && result.success) {
                showNotification('Moderator added successfully!', 'success');
                addModeratorIdInput.value = '';
                addModeratorUsernameInput.value = '';
                fetchModerators(); 
            } else {
                showNotification(`Failed to add moderator: ${result.message || 'Unknown error.'}`, 'error');
            }
        } catch (error) {
            console.error('Error adding moderator:', error);
            showNotification('Network error while adding moderator. Please try again.', 'error');
        } finally {
            addModeratorBtn.disabled = false;
        }
    }

    async function removeModerator(discordId) {
        showNotification('Removing moderator...', 'info');
        try {
            const response = await fetch(`/api/moderators/${discordId}`, {
                method: 'DELETE'
            });
            const result = await response.json();

            if (response.ok && result.success) {
                showNotification('Moderator removed successfully!', 'success');
                fetchModerators(); 
            } else {
                showNotification(`Failed to remove moderator: ${result.message || 'Unknown error.'}`, 'error');
            }
        } catch (error) {
            console.error('Error removing moderator:', error);
            showNotification('Network error while removing moderator. Please try again.', 'error');
        }
    }

    async function fetchBlacklistedUsers() {
        blacklistList.innerHTML = '<p class="text-gray-400 text-center">Loading blacklisted users...</p>';
        try {
            const response = await fetch('/api/blacklist');
            if (!response.ok) {
                throw new Error('Failed to fetch blacklisted users: ' + response.statusText);
            }
            const data = await response.json();
            if (data.success && data.blacklistedUsers.length > 0) {
                blacklistList.innerHTML = ''; 
                data.blacklistedUsers.forEach(user => {
                    blacklistList.appendChild(renderBlacklistedUserCard(user));
                });
            } else {
                blacklistList.innerHTML = '<p class="text-gray-400 text-center">No blacklisted users found.</p>';
            }
        } catch (error) {
            console.error('Error fetching blacklisted users:', error);
            showNotification('Failed to load blacklisted users. Please try again.', 'error');
            blacklistList.innerHTML = '<p class="text-red-400 text-center">Error loading blacklisted users.</p>';
        }
    }

    function renderBlacklistedUserCard(user) {
        const userCard = document.createElement('div');
        userCard.className = 'bg-gray-700 p-4 rounded-lg shadow-md flex items-center justify-between';
        userCard.innerHTML = `
            <div>
                <p class="text-lg font-semibold text-red-300">${user.username}</p>
                <p class="text-gray-400 text-sm">ID: ${user.discordId}</p>
                ${user.reason ? `<p class="text-gray-500 text-xs">Reason: ${user.reason}</p>` : ''}
                ${user.blacklistedByUsername ? `<p class="text-gray-500 text-xs">Blacklisted by: ${user.blacklistedByUsername}</p>` : ''}
            </div>
            <button class="remove-blacklist-btn bg-green-600 hover:bg-green-700 text-white font-semibold py-1.5 px-4 rounded-full text-sm transition duration-300 ease-in-out" data-discord-id="${user.discordId}">Remove</button>
        `;
        userCard.querySelector('.remove-blacklist-btn').addEventListener('click', async (e) => {
            const discordIdToRemove = e.target.dataset.discordId;
            const confirmRemove = await customConfirm(`Are you sure you want to remove ${discordIdToRemove} from the blacklist?`);
            if (confirmRemove) {
                removeBlacklistedUser(discordIdToRemove);
            }
        });
        return userCard;
    }

    async function addBlacklistedUser() {
        const discordId = addBlacklistIdInput.value.trim();
        const username = addBlacklistUsernameInput.value.trim();
        const reason = addBlacklistReasonInput.value.trim();

        if (!discordId || !username) {
            showNotification('Discord ID and Username are required to blacklist a user.', 'error');
            return;
        }

        addBlacklistBtn.disabled = true;
        showNotification('Blacklisting user...', 'info');

        try {
            const response = await fetch('/api/blacklist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ discordId, username, reason })
            });
            const result = await response.json();

            if (response.ok && result.success) {
                showNotification('User blacklisted successfully!', 'success');
                addBlacklistIdInput.value = '';
                addBlacklistUsernameInput.value = '';
                addBlacklistReasonInput.value = '';
                fetchBlacklistedUsers(); 
            } else {
                showNotification(`Failed to blacklist user: ${result.message || 'Unknown error.'}`, 'error');
            }
        } catch (error) {
            console.error('Error blacklisting user:', error);
            showNotification('Network error while blacklisting user. Please try again.', 'error');
        } finally {
            addBlacklistBtn.disabled = false;
        }
    }

    async function removeBlacklistedUser(discordId) {
        showNotification('Removing user from blacklist...', 'info');
        try {
            const response = await fetch(`/api/blacklist/${discordId}`, {
                method: 'DELETE'
            });
            const result = await response.json();

            if (response.ok && result.success) {
                showNotification('User removed from blacklist successfully!', 'success');
                fetchBlacklistedUsers(); 
            } else {
                showNotification(`Failed to remove user from blacklist: ${result.message || 'Unknown error.'}`, 'error');
            }
        } catch (error) {
            console.error('Error removing blacklisted user:', error);
            showNotification('Network error while removing blacklisted user. Please try again.', 'error');
        }
    }


    modalCloseButton.addEventListener('click', closeApplicationModal);
    applicationModal.addEventListener('click', (e) => {
        if (e.target === applicationModal) {
            closeApplicationModal();
        }
    });
    acceptButton.addEventListener('click', () => updateApplicationStatus('accepted'));
    rejectButton.addEventListener('click', () => updateApplicationStatus('rejected'));
    deleteButton.addEventListener('click', deleteApplication);

    searchButton.addEventListener('click', () => {
        const searchTerm = applicationSearchInput.value.trim();
        if (searchTerm) {
            fetchApplications(searchTerm);
        } else {
            fetchApplications();
        }
    });

    showApplicationsBtn.addEventListener('click', () => showSection('applications'));
    showModeratorsBtn.addEventListener('click', () => showSection('moderators'));
    showAdminsBtn.addEventListener('click', () => showSection('admins'));
    showBlacklistBtn.addEventListener('click', () => showSection('blacklist'));

    addAdminBtn.addEventListener('click', addAdmin);

    addModeratorBtn.addEventListener('click', addModerator);

    addBlacklistBtn.addEventListener('click', addBlacklistedUser);


    logoutButton.addEventListener('click', async () => {
        try {
            const response = await fetch('/auth/logout');
            if (response.ok) {
                window.location.href = '/';
            } else {
                showNotification('Failed to log out. Please try again.', 'error');
            }
        } catch (error) {
                console.error('Error during logout:', error);
                showNotification('Network error during logout. Please try again.', 'error');
        }
    });

    fetchSessionAndVerifyRoles().then(hasAccess => {
        if (hasAccess) {
            showSection('applications');
        }
    });
});
