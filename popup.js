document.addEventListener('DOMContentLoaded', () => {
    const options = document.querySelectorAll('.option');

    // Load current setting
    chrome.storage.sync.get(['displayStyle'], (result) => {
        const style = result.displayStyle || 'concise';
        const activeInput = document.querySelector(`input[value="${style}"]`);
        if (activeInput) {
            activeInput.checked = true;
            activeInput.closest('.option').classList.add('selected');
        }
    });

    // Save on change
    options.forEach(option => {
        option.addEventListener('click', () => {
            const radio = option.querySelector('input');
            const value = radio.value;

            // Update UI
            options.forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');
            radio.checked = true;

            // Save setting
            chrome.storage.sync.set({ displayStyle: value });
        });
    });
});
