document.addEventListener('DOMContentLoaded', () => {
    const options = document.querySelectorAll('.option');

    // Load current setting
    chrome.storage.sync.get(['displayStyle', 'matchDu', 'matchUppercase'], (result) => {
        const style = result.displayStyle || 'concise';
        const activeInput = document.querySelector(`input[value="${style}"]`);
        if (activeInput) {
            activeInput.checked = true;
            activeInput.closest('.option').classList.add('selected');
        }

        document.getElementById('match-du').checked = !!result.matchDu;
        document.getElementById('match-uppercase').checked = !!result.matchUppercase;
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

    document.querySelectorAll('.setting-toggle').forEach(toggle => {
        toggle.addEventListener('click', (e) => {
            if (e.target.tagName === 'INPUT') return;
            const checkbox = toggle.querySelector('input');
            checkbox.checked = !checkbox.checked;
            // Manually trigger change event
            checkbox.dispatchEvent(new Event('change'));
        });
    });

    document.getElementById('match-du').addEventListener('change', (e) => {
        chrome.storage.sync.set({ matchDu: e.target.checked });
    });

    document.getElementById('match-uppercase').addEventListener('change', (e) => {
        chrome.storage.sync.set({ matchUppercase: e.target.checked });
    });
});
