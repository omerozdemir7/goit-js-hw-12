import iziToast from 'izitoast';
import 'izitoast/dist/css/iziToast.min.css';
import SimpleLightbox from 'simplelightbox';
import 'simplelightbox/dist/simple-lightbox.min.css';

const searchForm = document.querySelector('#search-form');
const galleryContainer = document.querySelector('.gallery');
const loader = document.querySelector('.loader');
const loaderText = document.querySelector('.loader-text');

const API_KEY = '32475203-0397f154fda8b2c2a6bae1f0a';
const BASE_URL = 'https://pixabay.com/api/';

const lightbox = new SimpleLightbox('.gallery a', {
  captionsData: 'alt',
  captionDelay: 250,
});

searchForm.addEventListener('submit', onSearchSubmit);

async function onSearchSubmit(event) {
  event.preventDefault();
  event.stopPropagation();
  const form = event.currentTarget;
  const searchQuery = form.elements.searchQuery.value.trim();

  if (!searchQuery) {
    iziToast.error({
      title: 'Hata',
      message: 'Arama kutusu boş olamaz!',
      position: 'topRight',
    });
    return;
  }

  galleryContainer.innerHTML = '';
  showLoader();

  try {
    const data = await fetchImages(searchQuery);
    if (data.hits.length === 0) {
      iziToast.info({
        title: 'Bilgi',
        message:
          'Sorry, there are no images matching your search query. Please try again!',
        position: 'topRight',
      });
    } else {
      renderGallery(data.hits);
      lightbox.refresh();
    }
  } catch (error) {
    iziToast.error({
      title: 'Hata',
      message: `Bir hata oluştu: ${error.message}`,
      position: 'topRight',
    });
    console.error('Fetch Error:', error);
  } finally {
    hideLoader();
    form.reset();
  }
}

async function fetchImages(query) {
  const params = new URLSearchParams({
    key: API_KEY,
    q: query,
    image_type: 'photo',
    orientation: 'horizontal',
    safesearch: 'true',
  });

  const response = await fetch(`${BASE_URL}?${params}`);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}

function renderGallery(images) {
  const markup = images
    .map(
      ({
        webformatURL,
        largeImageURL,
        tags,
        likes,
        views,
        comments,
        downloads,
      }) => `<li class="gallery-item">
          <a class="gallery-link" href="${largeImageURL}">
            <img class="gallery-image" src="${webformatURL}" alt="${tags}" loading="lazy"/>
          </a>
          <div class="info">
            <p class="info-item"><b>Likes</b> ${likes}</p>
            <p class="info-item"><b>Views</b> ${views}</p>
            <p class="info-item"><b>Comments</b> ${comments}</p>
            <p class="info-item"><b>Downloads</b> ${downloads}</p>
          </div>
        </li>`
    )
    .join('');
  galleryContainer.innerHTML = markup;
}

function showLoader() {
  loader.classList.remove('hidden');
  loaderText.classList.remove('hidden');
}

function hideLoader() {
  loader.classList.add('hidden');
  loaderText.classList.add('hidden');
}
