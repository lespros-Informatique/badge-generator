// Inscription form logic
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('inscriptionForm');
    const successMessage = document.getElementById('successMessage');

    // Toast notification function
    function showToast(message, type = 'error') {
        const container = document.getElementById('toastContainer');

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        const icons = {
            error: '❌',
            success: '✅',
            warning: '⚠️',
            info: 'ℹ️'
        };

        toast.innerHTML = `
            <span class="toast-icon">${icons[type] || icons.error}</span>
            <span class="toast-message">${message}</span>
        `;

        container.appendChild(toast);

        // Auto remove after 4 seconds
        setTimeout(() => {
            toast.classList.add('slide-out');
            setTimeout(() => {
                container.removeChild(toast);
            }, 300);
        }, 4000);
    }

    // Form inputs
    const inputs = {
        nom: document.getElementById('nom'),
        prenoms: document.getElementById('prenoms'),
        poste: document.getElementById('poste'),
        contact: document.getElementById('contact'),
        dateBapteme: document.getElementById('dateBapteme'),
        dateAdhesion: document.getElementById('dateAdhesion'),
        photo: document.getElementById('photoUpload')
    };

    // Preview elements
    const previews = {
        nom: document.getElementById('previewNom'),
        prenoms: document.getElementById('previewPrenoms'),
        poste: document.getElementById('previewPoste'),
        contact: document.getElementById('previewContact'),
        bapteme: document.getElementById('previewBapteme'),
        adhesion: document.getElementById('previewAdhesion'),
        photo: document.getElementById('previewPhoto')
    };

    let photoData = null;

    // Update preview
    function updatePreview() {
        previews.nom.textContent = inputs.nom.value || 'NOM';
        previews.prenoms.textContent = inputs.prenoms.value || 'Prénoms';
        previews.poste.textContent = inputs.poste.value || 'Poste';

        // Add +225 prefix to contact display
        const contactValue = inputs.contact.value;
        if (contactValue) {
            previews.contact.textContent = '+225 ' + contactValue;
        } else {
            previews.contact.textContent = '-- -- -- -- --';
        }

        previews.bapteme.textContent = inputs.dateBapteme.value || '--/--/----';
        previews.adhesion.textContent = inputs.dateAdhesion.value || '--/--/----';

        // Generate QR Code
        generateQRCode();
    }

    // Generate QR Code with phone number for direct calling
    function generateQRCode() {
        const qrContainer = document.getElementById('previewQRCode');
        if (!qrContainer) return;

        qrContainer.innerHTML = ''; // Clear previous QR

        const contact = inputs.contact.value || '';

        // Format: tel:+225XXXXXXXXXX (format téléphone pour appel direct)
        // Si le numéro commence par 0, on le remplace par +225
        let phoneNumber = contact.replace(/\s/g, ''); // Enlever les espaces

        // Si le numéro commence par 0, remplacer par +225 (code Côte d'Ivoire)
        if (phoneNumber.startsWith('0')) {
            phoneNumber = '+225' + phoneNumber.substring(1);
        } else if (!phoneNumber.startsWith('+')) {
            phoneNumber = '+225' + phoneNumber;
        }

        const qrData = `tel:${phoneNumber}`;

        new QRCode(qrContainer, {
            text: qrData,
            width: 70,
            height: 70,
            colorDark: "#1e293b",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.M
        });
    }

    // Auto-format phone number (10 digits max with spaces)
    function formatPhoneInput(input) {
        input.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, ''); // Remove non-digits

            // Limit to 10 digits
            if (value.length > 10) {
                value = value.substring(0, 10);
            }

            // Validate first 2 digits (must be 01, 05, or 07)
            if (value.length >= 2) {
                const firstTwo = value.substring(0, 2);
                if (firstTwo !== '01' && firstTwo !== '05' && firstTwo !== '07') {
                    // Reset to valid prefix or clear
                    if (value.length === 2) {
                        value = value[0]; // Keep only first digit
                    }
                }
            }

            // Add spaces every 2 digits for readability (01 02 03 04 05)
            let formatted = '';
            for (let i = 0; i < value.length; i++) {
                if (i > 0 && i % 2 === 0) {
                    formatted += ' ';
                }
                formatted += value[i];
            }

            e.target.value = formatted;
            updatePreview(); // Update preview after formatting
        });

        // Prevent non-numeric input
        input.addEventListener('keypress', (e) => {
            if (e.key && !/[0-9]/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Delete') {
                e.preventDefault();
            }
        });

        // Show validation message
        input.addEventListener('blur', (e) => {
            const value = e.target.value.replace(/\D/g, '');
            if (value.length >= 2) {
                const firstTwo = value.substring(0, 2);
                if (firstTwo !== '01' && firstTwo !== '05' && firstTwo !== '07') {
                    showToast('Le numéro doit commencer par 01, 05 ou 07', 'warning');
                    e.target.value = '';
                    updatePreview();
                }
            }
        });
    }

    // Auto-format date fields (JJ/MM/AAAA)
    function formatDateInput(input) {
        input.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, ''); // Remove non-digits

            // Limit to 8 digits (JJMMAAAA)
            if (value.length > 8) {
                value = value.substring(0, 8);
            }

            // Add slashes automatically
            let formatted = '';
            if (value.length >= 1) {
                formatted = value.substring(0, 2); // JJ
            }
            if (value.length >= 3) {
                formatted += '/' + value.substring(2, 4); // MM
            }
            if (value.length >= 5) {
                formatted += '/' + value.substring(4, 8); // AAAA
            }

            e.target.value = formatted;
            updatePreview(); // Update preview after formatting
        });

        // Prevent non-numeric input except backspace/delete
        input.addEventListener('keypress', (e) => {
            if (e.key && !/[0-9]/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Delete') {
                e.preventDefault();
            }
        });
    }

    // Apply phone formatting
    formatPhoneInput(inputs.contact);

    // Apply date formatting to date fields
    formatDateInput(inputs.dateBapteme);
    formatDateInput(inputs.dateAdhesion);

    // Attach input listeners (excluding fields with custom formatting)
    Object.keys(inputs).forEach(key => {
        if (key !== 'photo' && key !== 'dateBapteme' && key !== 'dateAdhesion' && key !== 'contact') {
            inputs[key].addEventListener('input', updatePreview);
        }
    });

    // Handle photo upload
    inputs.photo.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                photoData = e.target.result;
                previews.photo.src = photoData;
            };
            reader.readAsDataURL(file);

            // Update file label
            const fileName = file.name;
            document.querySelector('.file-custom').textContent =
                fileName.length > 20 ? fileName.substring(0, 17) + '...' : fileName;
        }
    });

    // Handle form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Validate one field at a time - show only first error

        // Validate nom
        if (!inputs.nom.value.trim()) {
            showToast('Le champ "Nom" est obligatoire', 'error');
            return;
        }

        // Validate prenoms
        if (!inputs.prenoms.value.trim()) {
            showToast('Le champ "Prénoms" est obligatoire', 'error');
            return;
        }

        // Validate poste
        if (!inputs.poste.value.trim()) {
            showToast('Le champ "Poste" est obligatoire', 'error');
            return;
        }

        // Validate contact
        const contactValue = inputs.contact.value.replace(/\D/g, '');
        if (!contactValue) {
            showToast('Le champ "Contact" est obligatoire', 'error');
            return;
        }

        if (contactValue.length !== 10) {
            showToast('Le numéro de téléphone doit contenir 10 chiffres', 'error');
            return;
        }

        const firstTwo = contactValue.substring(0, 2);
        if (firstTwo !== '01' && firstTwo !== '05' && firstTwo !== '07') {
            showToast('Le numéro doit commencer par 01, 05 ou 07', 'error');
            return;
        }

        // Validate date de baptême
        const baptemeValue = inputs.dateBapteme.value;
        if (!baptemeValue) {
            showToast('Le champ "Date de baptême" est obligatoire', 'error');
            return;
        }

        if (baptemeValue.length !== 10) {
            showToast('La date de baptême doit être au format JJ/MM/AAAA', 'error');
            return;
        }

        // Validate date d'adhésion
        const adhesionValue = inputs.dateAdhesion.value;
        if (!adhesionValue) {
            showToast('Le champ "Date d\'adhésion" est obligatoire', 'error');
            return;
        }

        if (adhesionValue.length !== 10) {
            showToast('La date d\'adhésion doit être au format JJ/MM/AAAA', 'error');
            return;
        }

        // Validate photo
        if (!photoData) {
            showToast('Veuillez ajouter une photo de profil', 'error');
            return;
        }

        // All validations passed - proceed with submission

        // Get submit button
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalHTML = submitBtn.innerHTML;

        // Show loader
        submitBtn.disabled = true;
        submitBtn.innerHTML = `
            <svg class="spinner" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M8 0a8 8 0 1 0 8 8A8 8 0 0 0 8 0ZM8 14a6 6 0 1 1 6-6 6 6 0 0 1-6 6Z" opacity=".3"/>
                <path d="M8 0a8 8 0 0 1 8 8h-2a6 6 0 0 0-6-6V0Z"/>
            </svg>
            Inscription en cours...
        `;

        // Generate QR Code data string
        let phoneNumber = inputs.contact.value.replace(/\s/g, '') || '';
        if (phoneNumber.startsWith('0')) {
            phoneNumber = '+225' + phoneNumber.substring(1);
        } else if (!phoneNumber.startsWith('+') && phoneNumber.length > 0) {
            phoneNumber = '+225' + phoneNumber;
        }
        const qrCodeData = `tel:${phoneNumber}`;

        // Prepare member data
        const memberData = {
            nom: inputs.nom.value,
            prenoms: inputs.prenoms.value,
            poste: inputs.poste.value,
            contact: inputs.contact.value,
            dateBapteme: inputs.dateBapteme.value,
            dateAdhesion: inputs.dateAdhesion.value,
            photo: photoData,
            qrcode: qrCodeData
        };

        // Save to Supabase
        try {
            const member = await addMember(memberData);
            console.log('Membre enregistré:', member);

            // Show success message
            successMessage.style.display = 'block';
            form.style.display = 'none';

        } catch (error) {
            console.error('Erreur lors de l\'inscription:', error);
            alert('Une erreur est survenue. Veuillez réessayer.');

            // Restore button
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalHTML;
        }
    });

    // Initialize QR code on load
    generateQRCode();
});
