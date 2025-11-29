// Inscription form logic
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('inscriptionForm');
    const successMessage = document.getElementById('successMessage');

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
        previews.contact.textContent = inputs.contact.value || '-- -- -- -- --';
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

    // Attach input listeners
    Object.keys(inputs).forEach(key => {
        if (key !== 'photo') {
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

        // Validate photo
        if (!photoData) {
            alert('Veuillez ajouter une photo');
            return;
        }

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
