import iziToast from 'izitoast';
import 'izitoast/dist/css/iziToast.min.css';
import SimpleLightbox from 'simplelightbox';
import 'simplelightbox/dist/simple-lightbox.min.css';
import axios from 'axios'; // 1. Axios import edildi

// --- DOM Seçicileri ---
const searchForm = document.querySelector('#search-form');
const galleryContainer = document.querySelector('.gallery');
const loader = document.querySelector('.loader');
const loaderText = document.querySelector('.loader-text');
const loadMoreBtn = document.querySelector('.load-more-btn'); // "Load more" düğmesi seçicisi

// --- API ve Durum (State) Değişkenleri ---
const API_KEY = '32475203-0397f154fda8b2c2a6bae1f0a';
const BASE_URL = 'https://pixabay.com/api/';
const PER_PAGE = 40; // İstek başına 40 sonuç

let currentPage = 1;
let currentQuery = '';
let totalHits = 0;

const lightbox = new SimpleLightbox('.gallery a', {
  captionsData: 'alt',
  captionDelay: 250,
});

// --- Olay Dinleyicileri ---
searchForm.addEventListener('submit', onSearchSubmit);
loadMoreBtn.addEventListener('click', onLoadMore);

// --- Yeni Arama Fonksiyonu ---
async function onSearchSubmit(event) {
  event.preventDefault();
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

  // Yeni arama için durumu sıfırla
  currentQuery = searchQuery;
  currentPage = 1;
  galleryContainer.innerHTML = ''; // Galeriyi temizle
  hideLoadMoreBtn(); // Düğmeyi gizle
  showLoader(); // Yükleyiciyi göster

  try {
    const data = await fetchImages(currentQuery, currentPage);
    totalHits = data.totalHits; // Toplam sonuç sayısını sakla

    if (totalHits === 0) {
      iziToast.info({
        title: 'Bilgi',
        message:
          'Sorry, there are no images matching your search query. Please try again!',
        position: 'topRight',
      });
    } else {
      renderGallery(data.hits); // İlk sayfa sonuçlarını render et
      lightbox.refresh(); // Lightbox'ı güncelle
      checkEndAndUpdateButton(); // Sonuçların sonuna gelinip gelinmediğini kontrol et
    }
  } catch (error) {
    handleError(error);
  } finally {
    hideLoader(); // Yükleyiciyi gizle
    form.reset();
  }
}

// --- "Daha Fazla Yükle" Fonksiyonu ---
async function onLoadMore() {
  currentPage += 1; // Sayfa numarasını artır
  hideLoadMoreBtn(); // Düğmeyi gizle
  showLoader(); // Yükleyiciyi göster

  try {
    const data = await fetchImages(currentQuery, currentPage);
    renderGallery(data.hits); // Yeni görselleri galeriye ekle
    lightbox.refresh(); // Lightbox'ı güncelle
    smoothScroll(); // Sayfayı kaydır
    checkEndAndUpdateButton(); // Sonuçların sonuna gelinip gelinmediğini kontrol et
  } catch (error) {
    handleError(error);
  } finally {
    hideLoader(); // Yükleyiciyi gizle
  }
}

// --- API İsteği (Axios ile yeniden düzenlendi) ---
async function fetchImages(query, page) {
  // Axios için 'params' nesnesi
  const params = {
    key: API_KEY,
    q: query,
    image_type: 'photo',
    orientation: 'horizontal',
    safesearch: 'true',
    page: page,
    per_page: PER_PAGE, // Sayfa başına 40 sonuç
  };

  // Axios GET isteği
  const response = await axios.get(BASE_URL, { params });
  return response.data; // Axios, .json() işlemini otomatik yapar
}

// --- Galeri Render Fonksiyonu (Ekleme yapacak şekilde güncellendi) ---
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
  // innerHTML yerine insertAdjacentHTML kullanarak mevcut içeriğin üzerine ekle
  galleryContainer.insertAdjacentHTML('beforeend', markup);
}

// --- Yardımcı Fonksiyonlar ---

function showLoader() {
  loader.classList.remove('hidden');
  loaderText.classList.remove('hidden');
}

function hideLoader() {
  loader.classList.add('hidden');
  loaderText.classList.add('hidden');
}

function showLoadMoreBtn() {
  loadMoreBtn.classList.remove('hidden');
}

function hideLoadMoreBtn() {
  loadMoreBtn.classList.add('hidden');
}

// Sonuçların sonunu kontrol eden fonksiyon
function checkEndAndUpdateButton() {
  if (currentPage * PER_PAGE >= totalHits) {
    hideLoadMoreBtn(); // Düğmeyi gizle
    if (totalHits > 0) {
      // Sadece galeri boş değilse bu mesajı göster
      iziToast.info({
        title: 'Bilgi',
        message: "We're sorry, but you've reached the end of search results.",
        position: 'topRight',
      });
    }
  } else {
    showLoadMoreBtn(); // Daha fazla sonuç varsa düğmeyi göster
  }
}

// Düzgün kaydırma fonksiyonu
function smoothScroll() {
  const firstCard = galleryContainer.querySelector('.gallery-item');
  if (firstCard) {
    const cardHeight = firstCard.getBoundingClientRect().height;
    window.scrollBy({
      top: cardHeight * 2, // İki kart yüksekliği kadar kaydır
      behavior: 'smooth', // Düzgün (smooth) animasyon
    });
  }
}

// Hata yönetimi
function handleError(error) {
  iziToast.error({
    title: 'Hata',
    message: `Bir hata oluştu: ${error.message}`,
    position: 'topRight',
  });
  console.error('Fetch Error:', error);
}