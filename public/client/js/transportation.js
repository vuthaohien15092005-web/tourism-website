(function () {
    // Scoped behaviors for transportation hero only
    function ready(fn) {
        if (document.readyState === "complete" || document.readyState === "interactive") {
            setTimeout(fn, 0);
        } else {
            document.addEventListener("DOMContentLoaded", fn);
        }
    }

    ready(function () {
        var form = document.querySelector(".t-hero__form");
        var input = document.getElementById("t-hero-destination");
        if (!form || !input) return;

        form.addEventListener("submit", function (e) {
            e.preventDefault();
            var value = (input.value || "").trim();
            if (!value) {
                input.focus();
                input.classList.add("t-hero__input--invalid");
                setTimeout(function(){ input.classList.remove("t-hero__input--invalid"); }, 800);
                return;
            }
            // For now, just scroll to events section; can be replaced with real search
            var target = document.getElementById("events");
            if (target) {
                target.scrollIntoView({ behavior: "smooth", block: "start" });
            }
        });

        // Popular list click -> fill + submit
        var popular = document.querySelectorAll('.Search_swiper-destination__izo3h');
        popular.forEach(function(link){
            link.addEventListener('click', function(e){
                e.preventDefault();
                var dest = this.getAttribute('data-destination') || this.textContent.trim();
                input.value = dest;
                form.dispatchEvent(new Event('submit', { cancelable: true }));
            });
        });
    });
})();


