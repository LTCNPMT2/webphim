const $ = (id) => document.getElementById(id);
let movies = [];
let heroMovies = [];
let activeIndex = 0;
let heroTrackIndex = 1;
let heroTransitioning = false;
let heroPointerStartX = 0;
let heroPointerDelta = 0;
let autoplayTimer = null;
let heroPaused = false;
let heroHovering = false;
let trailerSizeIndex = 1;
let searchDebounce = null;
let favorites = JSON.parse(localStorage.getItem("starflyFavorites") || "[]");

// Số phim được đưa lên Hero (giữ hiệu năng & ảnh nền luôn sắc nét)
const HERO_LIMIT = 8;

// Số phim tối đa mỗi dãy phim
const RAIL_LIMIT = 30;

// Dữ liệu dự phòng để trang vẫn có Hero và poster nếu mở bằng file:// hoặc API/MySQL tạm mất kết nối.
const FALLBACK_MOVIES = [
  { id: -1, title: "Interstellar", year: 2014, genre: "Sci-Fi", rating: 8.7, description: "Một hành trình xuyên không gian để tìm kiếm mái nhà mới cho nhân loại.", poster: "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg", backdrop: "https://image.tmdb.org/t/p/original/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg", trailer: "https://www.youtube.com/embed/zSWdZVtXT7E" },
  { id: -2, title: "Dune: Part Two", year: 2024, genre: "Sci-Fi", rating: 8.6, description: "Paul Atreides đồng hành cùng Chani và người Fremen trên hành trình định mệnh.", poster: "https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg", backdrop: "https://image.tmdb.org/t/p/original/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg", trailer: "https://www.youtube.com/embed/Way9Dexny3w" },
  { id: -3, title: "Oppenheimer", year: 2023, genre: "Thriller", rating: 8.6, description: "Câu chuyện về nhà vật lý J. Robert Oppenheimer và kỷ nguyên nguyên tử.", poster: "https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg", backdrop: "https://image.tmdb.org/t/p/original/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg", trailer: "https://www.youtube.com/embed/uYPbbksJxIg" },
  { id: -4, title: "The Batman", year: 2022, genre: "Action", rating: 7.8, description: "Batman lần theo những manh mối đen tối giữa lòng Gotham.", poster: "https://image.tmdb.org/t/p/w500/74xTEgt7R36Fpooo50r9T25onhq.jpg", backdrop: "https://image.tmdb.org/t/p/original/74xTEgt7R36Fpooo50r9T25onhq.jpg", trailer: "https://www.youtube.com/embed/mqqft2x_Aa4" },
  { id: -5, title: "Spider-Man: No Way Home", year: 2021, genre: "Action", rating: 8.2, description: "Peter Parker đối mặt với những vị khách đến từ các vũ trụ khác.", poster: "https://image.tmdb.org/t/p/w500/1g0dhYtq4irTY1GPXvft6k4YLjm.jpg", backdrop: "https://image.tmdb.org/t/p/original/1g0dhYtq4irTY1GPXvft6k4YLjm.jpg", trailer: "https://www.youtube.com/embed/JfVOs4VSpmA" },
  { id: -6, title: "John Wick: Chapter 4", year: 2023, genre: "Action", rating: 7.6, description: "John Wick chiến đấu để giành lại tự do từ High Table.", poster: "https://image.tmdb.org/t/p/w500/vZloFAK7NmvMGKE7VkF5UHaz0I.jpg", backdrop: "https://image.tmdb.org/t/p/original/vZloFAK7NmvMGKE7VkF5UHaz0I.jpg", trailer: "https://www.youtube.com/embed/qEVUtrk8_B4" },
  { id: -7, title: "Your Name", year: 2016, genre: "Anime", rating: 8.8, description: "Hai người trẻ bất ngờ hoán đổi cơ thể và tìm kiếm sợi dây kết nối định mệnh.", poster: "https://image.tmdb.org/t/p/w500/q719jXXEzOoYaps6babgKnONONX.jpg", backdrop: "https://image.tmdb.org/t/p/original/q719jXXEzOoYaps6babgKnONONX.jpg", trailer: "https://www.youtube.com/embed/xU47nhruN-Q" },
  { id: -8, title: "A Quiet Place", year: 2018, genre: "Horror", rating: 7.5, description: "Một gia đình phải sống trong im lặng để tránh những sinh vật săn mồi bằng âm thanh.", poster: "https://image.tmdb.org/t/p/w500/nAU74GmpUk7t5iklEp3bufwDq4N.jpg", backdrop: "https://image.tmdb.org/t/p/original/nAU74GmpUk7t5iklEp3bufwDq4N.jpg", trailer: "https://www.youtube.com/embed/WR7cc5t7tv8" },
  { id: -9, title: "Deadpool & Wolverine", year: 2024, genre: "Action", rating: 7.6, description: "Deadpool và Wolverine bước vào nhiệm vụ xuyên đa vũ trụ hỗn loạn.", poster: "https://image.tmdb.org/t/p/w500/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg", backdrop: "https://image.tmdb.org/t/p/original/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg", trailer: "https://www.youtube.com/embed/73_1biulkYk" },
  { id: -10, title: "Inside Out 2", year: 2024, genre: "Comedy", rating: 7.6, description: "Riley bước vào tuổi thiếu niên cùng những cảm xúc mới.", poster: "https://image.tmdb.org/t/p/w500/vpnVM9B6NMmQpWeZvzLvDESb2QY.jpg", backdrop: "https://image.tmdb.org/t/p/original/vpnVM9B6NMmQpWeZvzLvDESb2QY.jpg", trailer: "https://www.youtube.com/embed/LEjhY15eCx0" },
  { id: -11, title: "Past Lives", year: 2023, genre: "Romance", rating: 7.8, description: "Hai người bạn thời thơ ấu gặp lại sau nhiều năm xa cách.", poster: "https://image.tmdb.org/t/p/w500/k3waqVXSnvCZWfJYNtdamTgTtTA.jpg", backdrop: "https://image.tmdb.org/t/p/original/k3waqVXSnvCZWfJYNtdamTgTtTA.jpg", trailer: "https://www.youtube.com/embed/kA244xewjcI" },
  { id: -12, title: "The Super Mario Bros. Movie", year: 2023, genre: "Comedy", rating: 7.0, description: "Mario và Luigi bắt đầu cuộc phiêu lưu lớn nhất đời mình.", poster: "https://image.tmdb.org/t/p/w500/1f3qspv64L5FXrRy0MFgXqB6hIh.jpg", backdrop: "https://image.tmdb.org/t/p/original/1f3qspv64L5FXrRy0MFgXqB6hIh.jpg", trailer: "https://www.youtube.com/embed/TnGl01FkMMo" },
];

// Poster lỗi tải -> ẩn ảnh và hiện khung gradient + tên phim (tránh ô đen)
const IMG_ONERROR =
  "this.style.display='none';var p=this.closest('.poster');if(p){p.classList.add('is-empty');}";

function posterImage(movie, className = "") {
  const src = movie.poster || movie.backdrop || "";
  return `<img src="${src}" alt="${movie.title}" class="${className}" loading="lazy" onerror="${IMG_ONERROR}">`;
}

function hasTrailer(movie) {
  return Boolean(String(movie.trailer || "").trim());
}

function card(movie) {
  return `<article class="movie-card" data-id="${movie.id}">
    <div class="poster">
      ${posterImage(movie)}
      <span class="poster-fallback">${movie.title}<br>${movie.year}</span>
      <div class="movie-actions">
        <button class="movie-action buy-action" type="button">Mua vé</button>
        ${
          hasTrailer(movie)
            ? '<button class="movie-action trailer-action" type="button">Trailer</button>'
            : ""
        }
      </div>
    </div>
    <div class="movie-info">
      <h3>${movie.title}</h3>
      <div class="movie-meta">
        <span>${movie.year}</span><span>•</span><span>${movie.genre}</span><strong>★ ${movie.rating}</strong>
      </div>
    </div>
  </article>`;
}

function render(list, target) {
  const rail = $(target);

  if (!rail) return;

  rail.innerHTML = list.map(card).join("");

  rail.querySelectorAll(".movie-card").forEach((item) => {
    const movieId = Number(item.dataset.id);
    const movie = movies.find((entry) => entry.id === movieId);

    item.addEventListener("click", () => openTrailer(movieId));

    const buyAction = item.querySelector(".buy-action");
    const trailerAction = item.querySelector(".trailer-action");
    const posterImageElement = item.querySelector(".poster img");

    if (buyAction) {
      buyAction.addEventListener("click", (event) => {
        event.stopPropagation();
        openBooking(movie);
      });
    }

    if (trailerAction) {
      trailerAction.addEventListener("click", (event) => {
        event.stopPropagation();
        openTrailer(movieId);
      });
    }

    // Ảnh poster tải xong -> đảm bảo hiện lại ảnh (tránh cache lỗi)
    if (posterImageElement) {
      posterImageElement.addEventListener("load", () => {
        item.querySelector(".poster")?.classList.remove("is-empty");
      });
    }
  });

  window.requestAnimationFrame(() => updateRailControls(rail));
}

function updateRailControls(rail) {
  if (!rail) return;
  const wrapper = rail.closest(".rail-carousel");
  if (!wrapper) return;
  const previous = wrapper.querySelector(".rail-prev");
  const next = wrapper.querySelector(".rail-next");
  const atStart = rail.scrollLeft <= 2;
  const atEnd = rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 2;
  previous.disabled = atStart;
  next.disabled = atEnd;
  previous.hidden = atStart;
  next.hidden = atEnd;
}

function bindRailControls() {
  document.querySelectorAll(".rail-carousel").forEach((wrapper) => {
    const rail = wrapper.querySelector(".rail");
    wrapper.querySelector(".rail-prev").onclick = () => {
      rail.scrollBy({ left: -rail.clientWidth * 0.82, behavior: "smooth" });
    };
    wrapper.querySelector(".rail-next").onclick = () => {
      rail.scrollBy({ left: rail.clientWidth * 0.82, behavior: "smooth" });
    };
    rail.addEventListener("scroll", () => updateRailControls(rail), {
      passive: true,
    });
    updateRailControls(rail);
  });
}

function getGenreGroups() {
  const counts = new Map();

  movies.forEach((movie) => {
    const genre = movie.genre || "Khác";
    counts.set(genre, (counts.get(genre) || 0) + 1);
  });

  return [...counts.entries()]
    .map(([genre, total]) => ({ genre, total }))
    .sort(
      (first, second) =>
        second.total - first.total || first.genre.localeCompare(second.genre),
    );
}

function renderCatalogSections() {
  const groups = getGenreGroups();
  const container = $("catalogSections");

  if (!container) return;

  if (!groups.length) {
    container.innerHTML = "";
    return;
  }

  const totalSections = groups.length + 2;

  container.innerHTML = groups
    .map(
      (group, index) => `<section class="catalog-section">
        <div class="section-heading">
          <div><span class="kicker">STARFLY LIBRARY</span><h2>${group.genre}</h2></div>
          <span class="rail-index">${String(index + 3).padStart(2, "0")} / ${String(
            totalSections,
          ).padStart(2, "0")} · ${group.total} PHIM</span>
        </div>
        <div class="rail-carousel">
          <button class="rail-arrow rail-prev" type="button" aria-label="Phim trước">←</button>
          <div class="rail" id="genreRail${index}"></div>
          <button class="rail-arrow rail-next" type="button" aria-label="Phim tiếp">→</button>
        </div>
      </section>`,
    )
    .join("");

  groups.forEach((group, index) => {
    const railId = `genreRail${index}`;

    render(
      movies
        .filter((movie) => (movie.genre || "Khác") === group.genre)
        .slice(0, RAIL_LIMIT),
      railId,
    );

    const rail = $(railId);
    if (rail) enableDrag(rail);
  });

  bindRailControls();
}

function heroSlide(movie, index) {
  // Seeded records used their portrait posters as backdrops. Use landscape
  // stills for every movie currently featured in the hero carousel.
  const heroBackdropByTitle = {
    Interstellar: "https://image.tmdb.org/t/p/original/rAiYTfKGqDCRIIqo664sY9XZIvQ.jpg",
    "Dune: Part Two": "https://image.tmdb.org/t/p/original/uhUO7vQQKvCTfQWubOt5MAKokbL.jpg",
    Oppenheimer: "https://image.tmdb.org/t/p/original/fm6KqXpk3M2HVveHwCrBSSBaO0V.jpg",
    "The Batman": "https://static.dc.com/dc/files/default_images/Movies-Gallery_TheBatman_City_6185ea4e1ca3d7.74512499.jpg?w=1920",
    "Spider-Man: No Way Home": "https://image.tmdb.org/t/p/original/1Rr5SrvHxMXHu5RjKpaMba8VTzi.jpg",
    "John Wick: Chapter 4": "https://image.tmdb.org/t/p/original/7I6VUdPj6tQECNHdviJkUHD2u89.jpg",
    "Your Name": "https://image.tmdb.org/t/p/original/dIWwZW7dJJtqC6CgWzYkNVKIUm8.jpg",
    "A Quiet Place": "https://image.tmdb.org/t/p/original/nIrDm42dy5PaXtUAzUfPmxM4mQm.jpg",
  };
  const sourceBackdrop = heroBackdropByTitle[movie.title] || movie.backdrop || movie.poster || "";
  const backdrop = sourceBackdrop.replace(/\/w\d+\//, "/original/");
  const total = String(heroMovies.length).padStart(2, "0");

  return `<article class="hero-slide" data-index="${index}">
    <div class="hero-slide-backdrop" style="background-image: url('${backdrop}')"></div>
    <div class="hero-shade"></div>
    <div class="hero-copy">
      <div class="eyebrow"><i></i> STARFLY ORIGINALS <span>${String(index + 1).padStart(2, "0")} / ${total}</span></div>
      <h1>${movie.title}</h1>
      <div class="hero-meta"><span>${movie.year}</span><span>•</span><span>${movie.genre}</span><span>•</span><strong>★ ${movie.rating}</strong></div>
      <p>${movie.description || ""}</p>
      <div class="hero-actions">
        ${
          hasTrailer(movie)
            ? '<button class="primary-btn hero-trailer" type="button">▶ <span>Xem trailer</span></button>'
            : ""
        }
        <button class="ghost-btn hero-details" type="button">＋ <span>Mua vé</span></button>
      </div>
    </div>
  </article>`;
}

function getHeroSlides() {
  if (heroMovies.length <= 1) {
    return heroMovies.map((movie, index) => heroSlide(movie, index));
  }

  return [
    heroSlide(heroMovies[heroMovies.length - 1], heroMovies.length - 1),
    ...heroMovies.map((movie, index) => heroSlide(movie, index)),
    heroSlide(heroMovies[0], 0),
  ];
}

function setHeroTrackPosition(animate = true, offset = 0) {
  const track = $("heroTrack");
  if (!track) return;

  const total = heroMovies.length > 1 ? heroMovies.length + 2 : 1;
  track.style.transition = animate ? "" : "none";
  track.style.transform = `translate3d(calc(-${heroTrackIndex} * (100% / ${total}) + ${offset}px), 0, 0)`;
}

function getIndicatorIndex() {
  const indicatorCount = Math.min(heroMovies.length, 8);

  return indicatorCount <= 1
    ? 0
    : Math.min(
        indicatorCount - 1,
        Math.floor((activeIndex * indicatorCount) / heroMovies.length),
      );
}

function getSlideIndexFromIndicator(indicatorIndex) {
  const indicatorCount = Math.min(heroMovies.length, 8);

  return indicatorCount >= heroMovies.length
    ? indicatorIndex
    : Math.min(
        heroMovies.length - 1,
        Math.round(
          (indicatorIndex * (heroMovies.length - 1)) / (indicatorCount - 1),
        ),
      );
}

function updateHeroIndicators() {
  $("heroIndicators")
    ?.querySelectorAll(".hero-indicator")
    .forEach((indicator, index) => {
      indicator.classList.toggle("active", index === getIndicatorIndex());
    });

  updateHeroCarousel();
}

function renderHeroIndicators() {
  const indicators = $("heroIndicators");
  if (!indicators) return;

  const indicatorCount = Math.min(heroMovies.length, 8);

  indicators.innerHTML = Array.from(
    { length: indicatorCount },
    (_, index) =>
      `<button class="hero-indicator ${index === getIndicatorIndex() ? "active" : ""}" type="button" aria-label="Đến slide ${index + 1}" data-indicator-index="${index}"></button>`,
  ).join("");

  indicators.querySelectorAll(".hero-indicator").forEach((indicator) => {
    indicator.onclick = () =>
      goToHeroIndex(
        getSlideIndexFromIndicator(Number(indicator.dataset.indicatorIndex)),
      );
  });
}

// Dãy poster nhỏ "ĐANG PHÁT" bên phải Hero
function renderHeroCarousel() {
  const carousel = $("heroCarousel");
  if (!carousel) return;

  carousel.innerHTML = heroMovies
    .map(
      (movie, index) =>
        `<button class="hero-poster ${index === activeIndex ? "active" : ""}" type="button" data-hero-index="${index}" aria-label="Xem ${movie.title}">${posterImage(movie)}</button>`,
    )
    .join("");

  carousel.querySelectorAll(".hero-poster").forEach((poster) => {
    poster.onclick = () => goToHeroIndex(Number(poster.dataset.heroIndex));
  });

  const counter = $("heroCount");
  if (counter) {
    counter.textContent = `${String(heroMovies.length).padStart(2, "0")} PHIM`;
  }

  updateHeroCarousel();
}

function updateHeroCarousel() {
  const carousel = $("heroCarousel");
  if (!carousel) return;

  carousel.querySelectorAll(".hero-poster").forEach((poster, index) => {
    const isActive = index === activeIndex;
    poster.classList.toggle("active", isActive);

    if (isActive) {
      const target =
        poster.offsetLeft - carousel.clientWidth / 2 + poster.clientWidth / 2;

      carousel.scrollTo({ left: Math.max(0, target), behavior: "smooth" });
    }
  });
}

function bindHeroSlideActions() {
  $("heroTrack")
    .querySelectorAll(".hero-slide")
    .forEach((slide) => {
      const movie = heroMovies[Number(slide.dataset.index)];
      if (!movie) return;

      const trailerButton = slide.querySelector(".hero-trailer");
      const detailsButton = slide.querySelector(".hero-details");

      if (trailerButton) trailerButton.onclick = () => openTrailer(movie.id);
      if (detailsButton) detailsButton.onclick = () => openBooking(movie);
    });
}

function renderHeroSlides(initial = false) {
  const track = $("heroTrack");
  if (!track) return;

  const total = heroMovies.length > 1 ? heroMovies.length + 2 : 1;

  track.style.setProperty("--hero-slide-count", total);
  track.innerHTML = getHeroSlides().join("");
  heroTrackIndex = heroMovies.length > 1 ? activeIndex + 1 : 0;
  setHeroTrackPosition(!initial);
  bindHeroSlideActions();
  renderHeroIndicators();
  updateHeroCarousel();
}

function setHero(index, options = {}) {
  if (!heroMovies.length) return;

  activeIndex = (index + heroMovies.length) % heroMovies.length;
  renderHeroSlides(options.initial === true);
}

function finishHeroTransition() {
  if (heroTrackIndex === 0) {
    heroTrackIndex = heroMovies.length;
    setHeroTrackPosition(false);
  } else if (heroTrackIndex === heroMovies.length + 1) {
    heroTrackIndex = 1;
    setHeroTrackPosition(false);
  }

  heroTransitioning = false;
}

function handleHeroTrackTransitionEnd(event) {
  if (event.propertyName !== "transform") return;
  finishHeroTransition();
}

function goToHeroIndex(index) {
  if (heroTransitioning || !heroMovies.length) return;

  resetAutoplay();

  const target = (index + heroMovies.length) % heroMovies.length;
  let difference = target - activeIndex;

  if (Math.abs(difference) > heroMovies.length / 2) {
    difference += difference > 0 ? -heroMovies.length : heroMovies.length;
  }

  if (!difference) {
    updateHeroCarousel();
    return;
  }

  heroTransitioning = true;
  activeIndex = target;
  heroTrackIndex += difference;
  updateHeroIndicators();
  setHeroTrackPosition(true);
}

function changeHeroBy(direction) {
  if (heroTransitioning || !heroMovies.length) return;

  resetAutoplay();

  heroTransitioning = true;
  activeIndex = (activeIndex + direction + heroMovies.length) % heroMovies.length;
  heroTrackIndex += direction;
  updateHeroIndicators();
  setHeroTrackPosition(true);
}

function resetAutoplay() {
  window.clearInterval(autoplayTimer);
  if (heroPaused) return;

  autoplayTimer = window.setInterval(() => {
    changeHeroBy(1);
  }, 4800);
}

function pauseAutoplay() {
  heroPaused = true;
  window.clearInterval(autoplayTimer);
}

function openTrailer(id) {
  const movie = movies.find((item) => item.id === id);
  if (!movie) return;

  const frame = $("trailerFrame");
  const frameWrap = frame.closest(".video-frame");

  $("videoTitle").textContent = movie.title;
  $("videoDescription").textContent = movie.description || "";
  $("videoMeta").textContent =
    `${movie.year}  •  ${movie.genre}  •  ★ ${movie.rating}`;

  if (hasTrailer(movie)) {
    const trailerUrl = new URL(movie.trailer);
    trailerUrl.searchParams.set("autoplay", "1");
    trailerUrl.searchParams.set("vq", "hd1080");
    trailerUrl.searchParams.set("hd", "1");
    trailerUrl.searchParams.set("rel", "0");
    frame.src = trailerUrl.toString();
    frameWrap?.classList.remove("is-hidden");
  } else {
    // Phim chưa có trailer -> không hiển thị khung video trống
    frame.src = "";
    frameWrap?.classList.add("is-hidden");

    $("videoDescription").textContent =
      `${movie.description || ""} Trailer sẽ sớm được cập nhật.`.trim();
  }

  $("buyFromTrailer").onclick = () => {
    closeTrailer();
    openBooking(movie);
  };

  $("trailerModal").classList.add("show");
  document.body.style.overflow = "hidden";
}

function closeTrailer() {
  $("trailerFrame").src = "";
  $("trailerModal").classList.remove("show");
  document.body.style.overflow = "";
}

function setTrailerSize(index) {
  trailerSizeIndex = Math.max(0, Math.min(2, index));
  const modal = document.querySelector(".video-modal");
  modal.classList.toggle("size-small", trailerSizeIndex === 0);
  modal.classList.toggle("size-large", trailerSizeIndex === 2);
}

function getSearchResults(query) {
  const normalizedQuery = query.trim().toLowerCase();

  return movies.filter((movie) =>
    `${movie.title} ${movie.genre} ${movie.year}`
      .toLowerCase()
      .includes(normalizedQuery),
  );
}

function renderSearchSuggestions(results, query) {
  const suggestions = $("searchSuggestions");

  if (!query) {
    suggestions.innerHTML = "";
    suggestions.classList.remove("show");
    return;
  }

  if (!results.length) {
    suggestions.innerHTML = `<div class="search-empty"><strong>⌕</strong><span>Không tìm thấy phim phù hợp.</span><small>Thử tìm với tên phim khác.</small></div>`;
    suggestions.classList.add("show");
    return;
  }

  suggestions.innerHTML = results
    .slice(0, 5)
    .map(
      (movie) => `<button class="search-result" type="button" data-search-id="${movie.id}">
        <img src="${movie.poster}" alt="${movie.title}" loading="lazy">
        <span><strong>${movie.title}</strong><small>${movie.year} · ${movie.genre}</small></span>
      </button>`,
    )
    .join("");

  suggestions.classList.add("show");

  suggestions.querySelectorAll("[data-search-id]").forEach((result) => {
    result.onclick = () => {
      const movie = movies.find((item) => item.id === Number(result.dataset.searchId));
      closeSearch(true);
      openTrailer(movie.id);
    };
  });
}

function updateSearch(showResults = false) {
  const query = $("searchInput").value.trim();

  window.clearTimeout(searchDebounce);

  searchDebounce = window.setTimeout(() => {
    const found = getSearchResults(query);

    renderSearchSuggestions(found, query);

    if (showResults) {
      $("searchResultsSection").classList.add("show");

      $("searchHeading").textContent = `${found.length} kết quả cho "${query}"`;

      $("emptySearch").classList.toggle("show", !found.length);

      render(found, "searchRail");

      $("searchResultsSection").scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, 240);
}

function closeSearch(force = false) {
  const hasQuery = $("searchInput").value.trim().length > 0;

  if (!force && hasQuery) return;

  $("searchInput").value = "";
  $("searchPanel").classList.remove("show");
  $("searchBtn").setAttribute("aria-expanded", "false");
  $("searchSuggestions").classList.remove("show");
  $("searchResultsSection").classList.remove("show");
}

function enableDrag(element) {
  let startX = 0;
  let scroll = 0;
  let dragging = false;

  element.addEventListener("pointerdown", (event) => {
    dragging = true;
    startX = event.clientX;
    scroll = element.scrollLeft;
    element.classList.add("dragging");
  });

  element.addEventListener("pointermove", (event) => {
    if (dragging) {
      element.scrollLeft = scroll - (event.clientX - startX);
    }
  });

  element.addEventListener("pointerup", () => {
    dragging = false;
    element.classList.remove("dragging");
  });

  element.addEventListener("pointercancel", () => {
    dragging = false;
    element.classList.remove("dragging");
  });
}

// =========================
// BOOKING / API
// =========================
const bookingState = {
  movie: null,
  showtime: null,
  seats: [],
  foods: [],
  selectedFoods: new Map(),
  seatPrice: 95000,
  customer: null,
};

function formatCurrency(amount) {
  return `${Number(amount).toLocaleString("vi-VN")} đ`;
}

async function requestApi(url, options = {}) {
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
    },
    ...options,
  });

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    throw new Error("Bạn đang mở bản server cũ hoặc Live Server. Hãy mở STARFLY tại http://localhost:3000.");
  }
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || "Không thể kết nối với STARFLY API.");
  }

  return data;
}

async function loadMoviesFromApi() {
  try {
    const catalog = await requestApi("/api/movies");

    if (!Array.isArray(catalog) || !catalog.length) {
      renderCatalogSections();
      showCatalogLoadError("Chưa có phim trong cơ sở dữ liệu. Hãy kiểm tra bảng movies của database starfly.");
      return;
    }

    movies = catalog.map((movie) => ({
      ...movie,
      id: Number(movie.id),
      year: Number(movie.year),
      rating: Number(movie.rating),
    }));

    render(movies.slice(0, 12), "trendingRail");

    render(
      [...movies].sort((first, second) => second.year - first.year).slice(0, 12),
      "newRail",
    );

    renderCatalogSections();

    heroMovies = movies.slice(0, HERO_LIMIT);
    setHero(0, { initial: true });
    resumePendingBooking();
  } catch (error) {
    console.error("Không tải được danh sách phim từ /api/movies:", error);
    movies = FALLBACK_MOVIES;
    render(movies.slice(0, 12), "trendingRail");
    render([...movies].sort((a, b) => b.year - a.year).slice(0, 12), "newRail");
    renderCatalogSections();
    heroMovies = movies.slice(0, HERO_LIMIT);
    setHero(0, { initial: true });
    resumePendingBooking();
    showCatalogLoadError("Đang hiển thị danh sách phim dự phòng vì API hoặc MySQL chưa kết nối. Mua vé cần mở website qua server STARFLY.");
  }
}

function showCatalogLoadError(message) {
  const heroTrack = $("heroTrack");
  if (heroTrack && !heroMovies.length) {
    heroTrack.innerHTML = `<div class="hero-load-error" role="status"><strong>STARFLY</strong><span>${message}</span></div>`;
  }

  ["trendingRail", "newRail"].forEach((railId) => {
    const rail = $(railId);
    if (rail && !rail.children.length) {
      rail.innerHTML = `<p class="catalog-load-error" role="status">${message}</p>`;
    }
  });
}

function resetBookingState(movie) {
  bookingState.movie = movie;
  bookingState.showtime = null;
  bookingState.seats = [];
  bookingState.foods = [];
  bookingState.selectedFoods = new Map();
  bookingState.customer = null;

  $("bookingTitle").textContent = `Mua vé — ${movie.title}`;
  $("bookingSubtitle").textContent =
    "Chọn suất chiếu, ghế và bắp nước. Vé sẽ dùng thông tin tài khoản của bạn.";
  $("customerStep").querySelector("h3").textContent = "04 / Chọn phương thức thanh toán";

  $("seatStep").classList.add("is-hidden");
  $("foodStep").classList.add("is-hidden");
  $("customerStep").classList.add("is-hidden");
  $("paymentStep").classList.add("is-hidden");
  document.querySelector('input[name="paymentMethod"][value="cash"]').checked = true;
  $("bookingSubmit").classList.add("is-hidden");
  $("bookingSubmit").disabled = false;

  $("bookingMessage").textContent = "";
  $("bookingMessage").className = "booking-message";

  $("bookingSummary").innerHTML =
    "<span>Chưa chọn suất chiếu</span><strong>0 đ</strong>";
}

async function openBooking(movie) {
  const customer = getSavedCustomer();
  if (!customer?.id) {
    const returnUrl = new URL("/pages/auth.html", window.location.origin);
    returnUrl.searchParams.set("continue", "booking");
    returnUrl.searchParams.set("movieId", String(movie.id));
    window.location.href = returnUrl.toString();
    return;
  }

  resetBookingState(movie);
  $("bookingModal").classList.add("show");
  document.body.style.overflow = "hidden";
  await loadShowtimes(movie.id);
}

window.STARFLY_BOOK_MOVIE_FROM_CHAT = (requestText) => {
  const normalize = (value) => String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
  const request = normalize(requestText);
  const movie = [...movies]
    .sort((first, second) => normalize(second.title).length - normalize(first.title).length)
    .find((entry) => request.includes(normalize(entry.title)));
  if (!movie) return null;
  void openBooking(movie);
  return movie.title;
};

async function loadShowtimes(movieId) {
  const showtimes = await requestApi(`/api/showtimes?movieId=${movieId}`);
  const list = $("showtimeList");

  if (!showtimes.length) {
    list.innerHTML =
      "<p class='booking-message'>Chưa có suất chiếu cho phim này.</p>";
    return;
  }

  list.innerHTML = showtimes
    .map(
      (showtime) => `
        <button class="showtime-option" data-showtime-id="${showtime.id}">
          <strong>${showtime.show_time}</strong>
          <small>${showtime.show_date} · ${showtime.room}</small>
        </button>
      `,
    )
    .join("");

  list.querySelectorAll(".showtime-option").forEach((button) => {
    button.addEventListener("click", () =>
      selectShowtime(
        showtimes.find((showtime) => showtime.id === Number(button.dataset.showtimeId)),
        button,
      ),
    );
  });
}

async function selectShowtime(showtime, button) {
  bookingState.showtime = showtime;
  bookingState.seats = [];
  bookingState.selectedFoods = new Map();

  $("showtimeList")
    .querySelectorAll(".showtime-option")
    .forEach((item) => item.classList.remove("selected"));

  button.classList.add("selected");

  $("seatStep").classList.remove("is-hidden");
  $("foodStep").classList.remove("is-hidden");
  $("customerStep").classList.add("is-hidden");
  $("bookingSubmit").classList.add("is-hidden");

  const seats = await requestApi(`/api/seats?showtimeId=${showtime.id}`);

  renderSeats(seats);
  await loadBookingFoods();
  updateBookingSummary();
}

async function loadBookingFoods() {
  const list = $("foodList");
  try {
    bookingState.foods = await requestApi("/api/food-items");
    if (!bookingState.foods.length) {
      list.innerHTML = '<p class="food-empty">Rạp chưa có món ăn trong danh mục.</p>';
      $("foodCount").textContent = "0 món";
      return;
    }
    const escape = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    })[char]);
    list.innerHTML = bookingState.foods.map((food) => {
      const id = Number(food.id);
      return `<article class="food-card" data-food-id="${id}">
        <div class="food-icon">${escape(food.icon || "🍿")}</div>
        <div class="food-info"><strong>${escape(food.name)}</strong><small>${escape(food.description)}</small><span class="food-price">${formatCurrency(food.price)}</span></div>
        <div class="food-qty"><small>Số lượng</small><div><button type="button" data-food-change="-1" aria-label="Giảm món">−</button><span data-food-quantity>0</span><button type="button" data-food-change="1" aria-label="Tăng món">+</button></div></div>
      </article>`;
    }).join("");
    list.querySelectorAll("[data-food-change]").forEach((button) => {
      button.onclick = () => {
        const card = button.closest("[data-food-id]");
        const id = Number(card.dataset.foodId);
        const current = bookingState.selectedFoods.get(id) || 0;
        const next = Math.max(0, Math.min(20, current + Number(button.dataset.foodChange)));
        if (next) bookingState.selectedFoods.set(id, next);
        else bookingState.selectedFoods.delete(id);
        card.querySelector("[data-food-quantity]").textContent = next;
        card.classList.toggle("selected", next > 0);
        updateBookingSummary();
      };
    });
    $("foodCount").textContent = `${bookingState.foods.length} món`;
  } catch (error) {
    const message = String(error.message).replace(/[&<>"']/g, "");
    list.innerHTML = `<p class="food-empty">Không tải được bắp nước: ${message}</p>`;
    $("foodCount").textContent = "Lỗi tải món";
  }
}

function renderSeats(seats) {
  $("seatMap").innerHTML = seats
    .map(
      (seat) => `
        <button
          class="seat ${seat.status === "sold" ? "sold" : ""}"
          data-seat-id="${seat.id}"
          ${seat.status === "sold" ? "disabled" : ""}
        >
          ${seat.seat_number}
        </button>
      `,
    )
    .join("");

  $("seatMap")
    .querySelectorAll(".seat:not(.sold)")
    .forEach((seatButton) => {
      seatButton.addEventListener("click", () => {
        const seatId = Number(seatButton.dataset.seatId);

        if (bookingState.seats.includes(seatId)) {
          bookingState.seats = bookingState.seats.filter((id) => id !== seatId);
          seatButton.classList.remove("selected");
        } else {
          bookingState.seats.push(seatId);
          seatButton.classList.add("selected");
        }

        if (bookingState.seats.length) {
          $("customerStep").classList.remove("is-hidden");
          $("bookingSubmit").classList.remove("is-hidden");
        } else {
          $("customerStep").classList.add("is-hidden");
          $("bookingSubmit").classList.add("is-hidden");
        }

        updateBookingSummary();
      });
    });
}

function updateBookingSummary() {
  const seatAmount = bookingState.seats.length * bookingState.seatPrice;
  const foodAmount = bookingState.foods.reduce(
    (sum, food) => sum + Number(food.price) * (bookingState.selectedFoods.get(Number(food.id)) || 0),
    0,
  );
  const total = seatAmount + foodAmount;
  const showtime = bookingState.showtime;
  const foodQuantity = [...bookingState.selectedFoods.values()].reduce(
    (sum, quantity) => sum + quantity,
    0,
  );

  $("seatCount").textContent = `${bookingState.seats.length} ghế`;
  $("foodCount").textContent = `${foodQuantity} món đã chọn`;

  $("bookingSummary").innerHTML = showtime
    ? `<span>${showtime.show_date} · ${showtime.show_time} · ${showtime.room}<br>Vé ${formatCurrency(seatAmount)} + Bắp nước ${formatCurrency(foodAmount)}</span><strong>${formatCurrency(total)}</strong>`
    : "<span>Chưa chọn suất chiếu</span><strong>0 đ</strong>";
}

async function submitBooking() {
  const customer = getSavedCustomer();
  if (!customer?.id) {
    const movie = bookingState.movie;
    if (movie) openBooking(movie);
    return;
  }

  const paymentMethod =
    document.querySelector('input[name="paymentMethod"]:checked')?.value ||
    "cash";

  try {
    const booking = await requestApi("/api/booking", {
      method: "POST",
      body: JSON.stringify({
        customerId: Number(customer.id),
        showtimeId: bookingState.showtime.id,
        seatIds: bookingState.seats,
        foodItems: [...bookingState.selectedFoods.entries()].map(([id, quantity]) => ({ id, quantity })),
        paymentMethod,
      }),
    });

    localStorage.setItem("starflyCustomerId", customer.id);
    const receipt = {
      orderId: booking.orderId,
      paymentContent: booking.paymentContent || `SF-${booking.orderId}`,
      paymentMethod,
      tickets: booking.tickets || [],
      qrUrl: booking.qrUrl || "",
      movie: bookingState.movie?.title || "STARFLY",
      showDate: bookingState.showtime?.show_date || "",
      showTime: bookingState.showtime?.show_time || "",
      room: bookingState.showtime?.room || "",
      seats: [...document.querySelectorAll("#seatMap .seat.selected")]
        .map((seat) => seat.textContent.trim()),
      foodItems: booking.foodItems || [],
      seatAmount: booking.seatAmount || 0,
      foodAmount: booking.foodAmount || 0,
      totalAmount: booking.totalAmount || 0,
      customer: customer.full_name || customer.email || "Khách STARFLY",
      createdAt: new Date().toISOString(),
    };
    sessionStorage.setItem("starflyLatestBooking", JSON.stringify(receipt));
    window.location.href = "/pages/ticket.html";
  } catch (error) {
    showBookingMessage(error.message, "error");

    if (error.message.includes("ghế")) {
      await selectShowtime(bookingState.showtime, $("showtimeList .selected"));
    }
  }
}

function waitForPayment(orderId, ticketCodes) {
  let attempts = 0;

  const timer = window.setInterval(async () => {
    attempts += 1;

    try {
      const data = await requestApi(`/api/orders/${orderId}`);

      if (data.order.status === "paid") {
        window.clearInterval(timer);

        showBookingMessage(
          `Thanh toán thành công. Mã vé: ${ticketCodes.join(", ")}`,
          "success",
        );
      }

      if (
        data.order.status === "cancelled" ||
        data.order.status === "failed" ||
        attempts >= 100
      ) {
        window.clearInterval(timer);

        if (data.order.status !== "paid") {
          showBookingMessage(
            "Đơn thanh toán chưa hoàn tất hoặc đã thất bại.",
            "error",
          );
        }
      }
    } catch (error) {
      if (attempts >= 100) {
        window.clearInterval(timer);
      }
    }
  }, 3000);
}

function showBookingMessage(message, type) {
  $("bookingMessage").textContent = message;
  $("bookingMessage").className = `booking-message ${type}`;
}

function closeBooking() {
  $("bookingModal").classList.remove("show");
  document.body.style.overflow = "";
}

async function openMyTickets() {
  const customerId = localStorage.getItem("starflyCustomerId");

  $("ticketsModal").classList.add("show");
  document.body.style.overflow = "hidden";

  if (!customerId) {
    $("ticketsList").innerHTML =
      "<p class='booking-message'>Bạn chưa có vé nào. Hãy chọn một bộ phim để bắt đầu.</p>";
    return;
  }

  const tickets = await requestApi(`/api/tickets?customer_id=${encodeURIComponent(customerId)}`);

  const customerTickets = tickets.filter(
    (ticket) => ticket.customer_id === Number(customerId) && ticket.status === "valid",
  );

  $("ticketsList").innerHTML = customerTickets.length
    ? customerTickets
        .map(
          (ticket) => `
            <article class="ticket-card">
              <img src="${ticket.poster || ""}" alt="${ticket.title}" onerror="this.style.display='none'">
              <div>
                <h3>${ticket.title}</h3>
                <p>${ticket.show_date} · ${ticket.show_time} · ${ticket.room} · Ghế ${ticket.seat_number}</p>
                <small>${ticket.ticket_code} · ${formatCurrency(ticket.price)}</small>
              </div>
              <strong>${ticket.status === "valid" ? "CÒN HIỆU LỰC" : ticket.status.toUpperCase()}</strong>
            </article>
          `,
        )
        .join("")
    : "<p class='booking-message'>Chưa tìm thấy vé đã mua.</p>";
}

function getSavedCustomer() {
  try {
    return JSON.parse(localStorage.getItem("starflyCustomer") || "null");
  } catch {
    return null;
  }
}

function resumePendingBooking() {
  const params = new URLSearchParams(window.location.search);
  const movieId = Number(params.get("bookMovie"));
  if (!movieId) return;

  const movie = movies.find((item) => item.id === movieId);
  window.history.replaceState({}, "", window.location.pathname + window.location.hash);
  if (!movie) return;
  if (!getSavedCustomer()?.id) {
    const returnUrl = new URL("/pages/auth.html", window.location.origin);
    returnUrl.searchParams.set("continue", "booking");
    returnUrl.searchParams.set("movieId", String(movie.id));
    window.location.href = returnUrl.toString();
    return;
  }
  openBooking(movie);
}

function updateAccountButton() {
  const customer = getSavedCustomer();
  const button = $("accountButton");
  button.textContent = customer?.full_name || "Đăng nhập";
  button.title = customer?.email || "Đăng nhập hoặc đăng ký STARFLY";
}

async function loadManagement(type = "tickets") {
  $("managementSection").classList.add("show");

  document
    .querySelectorAll(".management-tab")
    .forEach((tab) => tab.classList.toggle("active", tab.dataset.management === type));

  if (type === "tickets") {
    const query = new URLSearchParams({
      search: $("managementSearch").value,
      status: $("managementStatus").value,
    });

    const tickets = await requestApi(`/api/tickets?${query}`);

    renderManagementTable(
      ["Mã vé", "Khách hàng", "Phim", "Suất chiếu", "Ghế", "Giá", "Trạng thái"],
      tickets.map((ticket) => [
        ticket.ticket_code,
        ticket.full_name,
        ticket.title,
        `${ticket.show_date} ${ticket.show_time}`,
        ticket.seat_number,
        formatCurrency(ticket.price),
        `<span class="status-badge">${ticket.status}</span>`,
      ]),
    );
  }

  if (type === "customers") {
    const customers = await requestApi("/api/customers");

    renderManagementTable(
      ["ID", "Khách hàng", "Email", "Phim", "Ghế", "Số vé", "Tổng tiền", "Trạng thái"],
      customers.map((customer) => [
        customer.id,
        customer.full_name,
        customer.email,
        customer.movies || "—",
        customer.seats || "—",
        customer.ticket_count,
        formatCurrency(customer.total_spent),
        `<span class="status-badge">${customer.status}</span>`,
      ]),
    );
  }

  if (type === "showtimes") {
    const showtimes = await requestApi("/api/showtimes");

    renderManagementTable(
      ["Phim", "Ngày", "Giờ", "Phòng", "Số ghế"],
      showtimes.map((showtime) => [
        showtime.title,
        showtime.show_date,
        showtime.show_time,
        showtime.room,
        showtime.total_seats,
      ]),
    );
  }
}

function renderManagementTable(headers, rows) {
  $("managementHead").innerHTML = `<tr>${headers.map((header) => `<th>${header}</th>`).join("")}</tr>`;

  $("managementBody").innerHTML = rows.length
    ? rows
        .map((row) => `<tr>${row.map((value) => `<td>${value}</td>`).join("")}</tr>`)
        .join("")
    : "<tr><td colspan='8'>Chưa có dữ liệu.</td></tr>";
}

function bindBookingEvents() {
  $("closeBooking").onclick = closeBooking;
  $("bookingSubmit").onclick = submitBooking;
  $("myTicketsButton").onclick = openMyTickets;
  $("accountButton").onclick = () => {
    window.location.href = "/pages/auth.html";
  };

  $("closeTickets").onclick = () => {
    $("ticketsModal").classList.remove("show");
    document.body.style.overflow = "";
  };

  $("adminButton").onclick = () => {
    window.location.assign("/admin/adminlogin.html");
  };

  $("managementSearch").oninput = () => loadManagement();
  $("managementStatus").onchange = () => loadManagement();

  $("addShowtimeButton").onclick = async () => {
    const movieChoices = movies.map((movie) => `${movie.id}: ${movie.title}`).join("\n");
    const movieId = Number(prompt(`Nhập ID phim:\n${movieChoices}`, String(movies[0]?.id || "")));
    const localDate = new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
      .toISOString().slice(0, 10);
    const showDate = prompt("Ngày chiếu (YYYY-MM-DD):", localDate);
    const showTime = prompt("Giờ chiếu (HH:MM):", "20:00");
    const room = prompt("Phòng chiếu:", "Phòng 1");

    if (!movieId || !showDate || !showTime || !room) {
      return;
    }

    try {
      await requestApi("/api/showtimes", {
        method: "POST",
        body: JSON.stringify({ movieId, showDate, showTime, room, totalSeats: 60 }),
      });

      await loadManagement("showtimes");
    } catch (error) {
      alert(error.message);
    }
  };

  $("bulkShowtimeButton").onclick = async () => {
    const movieChoices = movies.map((movie) => `${movie.id}: ${movie.title}`).join("\n");
    const movieId = Number(prompt(`Nhập ID phim cần tạo nhiều suất:\n${movieChoices}`, String(movies[0]?.id || "")));
    if (!movieId) return;

    const localDate = new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
      .toISOString().slice(0, 10);
    const fromDate = prompt("Ngày bắt đầu (YYYY-MM-DD):", localDate);
    if (!fromDate) return;
    const days = Number(prompt("Tạo lịch trong bao nhiêu ngày? (1–14)", "3"));
    const timesText = prompt("Các khung giờ, cách nhau bằng dấu phẩy:", "10:00, 13:00, 16:00, 19:00, 21:30");
    const times = String(timesText || "").split(",").map((time) => time.trim()).filter(Boolean);
    const room = prompt("Phòng chiếu:", "Phòng 1");
    if (!fromDate || !days || !times.length || !room) return;

    try {
      const result = await requestApi("/api/showtimes/bulk", {
        method: "POST",
        body: JSON.stringify({ movieId, fromDate, days, times, room, totalSeats: 60 }),
      });
      await loadManagement("showtimes");
      alert(`Đã tạo ${result.created} suất chiếu mới. Các giờ bị trùng trong cùng ngày/phòng được bỏ qua.`);
    } catch (error) {
      alert(error.message);
    }
  };

  document.querySelectorAll(".management-tab").forEach((tab) => {
    tab.onclick = () => loadManagement(tab.dataset.management);
  });

  ["bookingModal", "ticketsModal"].forEach((modalId) => {
    $(modalId).onclick = (event) => {
      if (event.target === $(modalId)) {
        $(modalId).classList.remove("show");
        document.body.style.overflow = "";
      }
    };
  });
}

// =========================
// KHỞI TẠO
// =========================
bindRailControls();
document.querySelectorAll(".rail,.genre-strip").forEach(enableDrag);
updateAccountButton();

$("heroPrev").onclick = () => changeHeroBy(-1);
$("heroNext").onclick = () => changeHeroBy(1);

$("heroTrack").addEventListener("transitionend", handleHeroTrackTransitionEnd);

$("heroTrack").addEventListener("pointerdown", (event) => {
  if (heroTransitioning) return;
  if (event.target.closest("button")) return;

  pauseAutoplay();

  heroPointerStartX = event.clientX;
  heroPointerDelta = 0;

  $("heroTrack").setPointerCapture(event.pointerId);

  setHeroTrackPosition(false);
});

$("heroTrack").addEventListener("pointermove", (event) => {
  if (!$("heroTrack").hasPointerCapture(event.pointerId)) return;

  heroPointerDelta = event.clientX - heroPointerStartX;

  setHeroTrackPosition(false, heroPointerDelta);
});

$("heroTrack").addEventListener("pointerup", (event) => {
  if (!$("heroTrack").hasPointerCapture(event.pointerId)) return;

  $("heroTrack").releasePointerCapture(event.pointerId);

  if (Math.abs(heroPointerDelta) > 50) {
    changeHeroBy(heroPointerDelta < 0 ? 1 : -1);
  } else {
    setHeroTrackPosition(true);
  }

  if (!heroHovering) {
    heroPaused = false;
    resetAutoplay();
  }

  heroPointerDelta = 0;
});

$("heroTrack").addEventListener("pointercancel", () => {
  heroPointerDelta = 0;

  setHeroTrackPosition(true);

  if (!heroHovering) {
    heroPaused = false;
    resetAutoplay();
  }
});

document.querySelector(".hero").addEventListener("mouseenter", () => {
  heroHovering = true;
  pauseAutoplay();
});

document.querySelector(".hero").addEventListener("mouseleave", () => {
  heroHovering = false;
  heroPaused = false;
  resetAutoplay();
});

$("closeTrailer").onclick = closeTrailer;
$("trailerShrink").onclick = () => setTrailerSize(trailerSizeIndex - 1);
$("trailerGrow").onclick = () => setTrailerSize(trailerSizeIndex + 1);
$("trailerResetSize").onclick = () => setTrailerSize(1);

$("trailerModal").onclick = (e) => {
  if (e.target === $("trailerModal")) {
    closeTrailer();
  }
};

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeTrailer();
    closeSearch(true);
    document.body.style.overflow = "";
  }
});

$("searchBtn").onclick = () => {
  $("searchPanel").classList.add("show");
  $("searchBtn").setAttribute("aria-expanded", "true");
  $("searchInput").focus();
};

$("closeSearch").onclick = () => closeSearch(true);

$("clearSearch").onclick = () => {
  $("searchInput").value = "";
  $("searchResultsSection").classList.remove("show");
  updateSearch();
};

$("searchInput").oninput = () => updateSearch();

$("searchInput").onkeydown = (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    updateSearch(true);
    $("searchSuggestions").classList.remove("show");
  }
};

document.addEventListener("click", (event) => {
  if (!$("searchControl").contains(event.target)) {
    closeSearch();
  }
});

window.addEventListener("scroll", () =>
  $("navbar").classList.toggle("scrolled", scrollY > 30),
);

document.querySelectorAll("[data-genre]").forEach(
  (button) =>
    (button.onclick = () => {
      $("searchPanel").classList.add("show");
      $("searchBtn").setAttribute("aria-expanded", "true");
      $("searchInput").value = button.dataset.genre;

      updateSearch(true);

      document.querySelector("#searchResultsSection").scrollIntoView({ behavior: "smooth" });
    }),
);

$("favoritesBtn").onclick = () => {
  const list = movies.filter((movie) => favorites.includes(movie.id));

  render(list, "trendingRail");

  document.querySelector("#trending").scrollIntoView({ behavior: "smooth" });
};

resetAutoplay();
bindBookingEvents();
loadMoviesFromApi();



