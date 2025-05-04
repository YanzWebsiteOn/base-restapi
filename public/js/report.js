document.addEventListener('DOMContentLoaded', function () {
    function updateCurrentTime() {
        const now = new Date();
        const timeString = now.toLocaleTimeString();
        document.getElementById('current-time').textContent = timeString;
    }

    setInterval(updateCurrentTime, 1000);
    updateCurrentTime();

    const descriptionTextarea = document.getElementById('issue-description');
    const charCounter = document.getElementById('desc-counter');

    descriptionTextarea.addEventListener('input', function () {
        const currentLength = this.value.length;
        charCounter.textContent = `${currentLength}/1000`;

        if (currentLength > 1000) {
            charCounter.style.color = 'var(--danger)';
        } else {
            charCounter.style.color = 'var(--gray-dark)';
        }
    });

    const fileInput = document.getElementById('screenshot');
    const fileNameDisplay = document.getElementById('file-name');

    fileInput.addEventListener('change', function () {
        if (this.files.length > 0) {
            fileNameDisplay.textContent = this.files[0].name;
        } else {
            fileNameDisplay.textContent = 'No file chosen';
        }
    });

    const cancelBtn = document.getElementById('cancel-report');
    cancelBtn.addEventListener('click', function () {
        Swal.fire({
            title: 'Discard report?',
            text: 'Are you sure you want to discard this report? All entered information will be lost.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, discard it',
            cancelButtonText: 'No, keep editing',
            reverseButtons: true
        }).then((result) => {
            if (result.isConfirmed) {
                document.getElementById('issue-type').value = 'bug';
                document.getElementById('issue-description').value = '';
                document.getElementById('contact-info').value = '';
                document.getElementById('screenshot').value = '';
                fileNameDisplay.textContent = 'No file chosen';
                charCounter.textContent = '0/1000';

                Swal.fire(
                    'Discarded!',
                    'Your report has been cleared.',
                    'success'
                );
            }
        });
    });

    const reportForm = document.getElementById('submit-report');

    reportForm.addEventListener('click', async function () {
        const issueType = document.getElementById('issue-type').value;
        const description = document.getElementById('issue-description').value.trim();
        const contact = document.getElementById('contact-info').value.trim();
        const file = fileInput.files[0];

        if (!description) {
            Swal.fire({
                title: 'Description required',
                text: 'Please enter a description of the issue',
                icon: 'error',
                confirmButtonText: 'OK'
            });
            return;
        }

        if (description.length > 1000) {
            Swal.fire({
                title: 'Description too long',
                text: 'Please keep your description under 1000 characters',
                icon: 'error',
                confirmButtonText: 'OK'
            });
            return;
        }

        const swal = Swal.fire({
            title: 'Submitting report...',
            html: 'Please wait while we process your report',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        try {
            const formData = new FormData();
            formData.append('issue', issueType);
            formData.append('description', description);
            if (contact) formData.append('contact', contact);
            if (file) formData.append('screenshot', file);

            const response = await fetch('/report', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            await Swal.close();

            if (data.success) {
                await Swal.fire({
                    title: 'Report submitted!',
                    text: 'Thank you for your feedback. We will review your report shortly.',
                    icon: 'success',
                    confirmButtonText: 'OK'
                });

                document.getElementById('issue-description').value = '';
                document.getElementById('contact-info').value = '';
                document.getElementById('screenshot').value = '';
                fileNameDisplay.textContent = 'No file chosen';
                charCounter.textContent = '0/1000';
            } else {
                Swal.fire({
                    title: 'Submission failed',
                    text: data.message || 'Unknown error occurred while submitting your report',
                    icon: 'error',
                    confirmButtonText: 'OK'
                });
            }
        } catch (error) {
            await Swal.close();
            Swal.fire({
                title: 'Error',
                text: 'Failed to submit report: ' + error.message,
                icon: 'error',
                confirmButtonText: 'OK'
            });
        }
    });

    const sidebarToggle = document.querySelector('.sidebar-toggle');
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');

    sidebarToggle.addEventListener('click', function () {
        sidebar.classList.toggle('collapsed');
        mainContent.classList.toggle('sidebar-collapsed');
    });
});