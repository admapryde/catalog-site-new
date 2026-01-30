'use client';

import { useState, useEffect } from 'react';
import { Page, PageBlock, PageBlockImage, PageBlockLink } from '@/types';
import FileUpload from '@/components/admin/FileUpload';
import OptimizedImage from '@/components/OptimizedImage';
import { useNotification } from '@/hooks/useNotification';

export default function PagesManager() {
  const [pages, setPages] = useState<Page[]>([]);
  const [blocks, setBlocks] = useState<PageBlock[]>([]);
  const [originalBlocks, setOriginalBlocks] = useState<PageBlock[]>([]); // Сохраняем оригинальный порядок
  const [images, setImages] = useState<PageBlockImage[]>([]);
  const [links, setLinks] = useState<PageBlockLink[]>([]);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'pages' | 'blocks'>('pages');
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [blockTitle, setBlockTitle] = useState('');
  const [blockType, setBlockType] = useState<'text' | 'photo' | 'links'>('text');
  const [blockContent, setBlockContent] = useState('');
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [imageFiles, setImageFiles] = useState<{blockId: string, urls: string[]}[]>([]);
  const [imageLayoutType, setImageLayoutType] = useState<'simple' | 'banner' | 'horizontal_pair' | 'horizontal_triple' | 'grid_four' | 'image_text_side'>('simple');
  const [linkTitle, setLinkTitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasUnsavedBlockChanges, setHasUnsavedBlockChanges] = useState(false); // Состояние для отслеживания изменений порядка блоков

  const { showNotification, renderNotification } = useNotification();

  // Загрузка данных
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Загрузка страниц с их блоками, изображениями и ссылками
        const pagesResponse = await fetch('/api/admin/pages-with-data');
        if (!pagesResponse.ok) {
          const errorText = await pagesResponse.text();
          console.error('Ошибка загрузки страниц:', errorText);
          throw new Error(`Ошибка загрузки страниц: ${pagesResponse.status} ${pagesResponse.statusText}`);
        }
        const pagesWithData = await pagesResponse.json();

        // Извлекаем отдельные массивы данных
        const allPages = pagesWithData.map((p: any) => ({ id: p.id, title: p.title, slug: p.slug, created_at: p.created_at, updated_at: p.updated_at }));
        const allBlocks = pagesWithData.flatMap((p: any) => p.page_blocks);
        const allImages = allBlocks.flatMap((b: any) => b.page_block_images || []).map((img: any) => ({
          ...img,
          is_main: img.is_main || false
        }));
        const allLinks = allBlocks.flatMap((b: any) => b.page_block_links || []);

        setPages(allPages);
        setBlocks(allBlocks);
        setOriginalBlocks([...allBlocks]); // Сохраняем оригинальный порядок
        setImages(allImages);
        setLinks(allLinks);
      } catch (error) {
        console.error('Ошибка загрузки данных:', error);
        showNotification(error instanceof Error ? error.message : 'Неизвестная ошибка при загрузке данных', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Обновление изображений при изменении
  useEffect(() => {
    if (selectedPageId) {
      const pageBlocks = blocks.filter(b => b.page_id === selectedPageId);
      const blockIds = pageBlocks.map(b => b.id);
      const pageImages = images.filter(img => blockIds.includes(img.block_id));
      const pageLinks = links.filter(l => blockIds.includes(l.block_id));

      // Обновляем состояния для изображений и ссылок
      const newImageFiles = pageBlocks.map(block => {
        const blockImages = pageImages.filter(img => img.block_id === block.id);
        return {
          blockId: block.id,
          urls: blockImages.map(img => img.image_url)
        };
      });

      setImageFiles(newImageFiles);
    }
  }, [selectedPageId, blocks, images, links]);

  const handlePageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Проверяем, что slug уникален (если создаем новую страницу)
    if (!editingPageId) {
      const duplicatePage = pages.find(p => p.slug === slug);
      if (duplicatePage) {
        showNotification('Страница с таким URL-идентификатором уже существует', 'error');
        return;
      }
    }

    try {
      if (editingPageId) {
        // Обновление существующей страницы
        const response = await fetch('/api/admin/pages', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingPageId, title, slug })
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Ошибка обновления страницы:', response.status, errorText);
          throw new Error(`Ошибка обновления страницы: ${response.status} ${errorText}`);
        }

        const updatedPage = await response.json();
        const updatedPages = pages.map(p =>
          p.id === editingPageId ? updatedPage[0] : p
        );
        setPages(updatedPages);
      } else {
        // Создание новой страницы
        const response = await fetch('/api/admin/pages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, slug })
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Ошибка создания страницы:', response.status, errorText);
          throw new Error(`Ошибка создания страницы: ${response.status} ${errorText}`);
        }

        const newPage = await response.json();
        setPages([...pages, newPage[0]]);
      }

      // Сброс формы
      setTitle('');
      setSlug('');
      setEditingPageId(null);
      showNotification(editingPageId ? 'Страница успешно обновлена!' : 'Страница успешно создана!', 'success');
    } catch (error: any) {
      console.error('Ошибка сохранения страницы:', error);
      showNotification(error.message || 'Произошла ошибка при сохранении страницы', 'error');
    }
  };

  const handleBlockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPageId) {
      showNotification('Пожалуйста, выберите страницу', 'error');
      return;
    }

    try {
      if (editingBlockId) {
        // Обновление существующего блока
        const response = await fetch('/api/admin/page-blocks', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingBlockId,
            page_id: selectedPageId,
            block_type: blockType,
            title: blockTitle,
            content: blockType === 'text' ? blockContent : undefined,
            sort_order: blocks.find(b => b.id === editingBlockId)?.sort_order || 0
          })
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Ошибка обновления блока:', response.status, errorText);
          throw new Error(`Ошибка обновления блока: ${response.status} ${errorText}`);
        }

        const updatedBlock = await response.json();
        const updatedBlocks = blocks.map(b =>
          b.id === editingBlockId ? updatedBlock[0] : b
        );
        setBlocks(updatedBlocks);

        // Если это фото-блок, обновляем layout_type и text_content у связанных изображений
        if (blockType === 'photo') {
          try {
            // Получаем изображения для этого блока
            const imagesResponse = await fetch(`/api/admin/page-block-images?blockId=${editingBlockId}`);
            if (imagesResponse.ok) {
              const blockImages = await imagesResponse.json();

              // Обновляем layout_type и text_content для всех изображений этого блока
              await Promise.all(
                blockImages.map(async (image: any) => {
                  const updateResponse = await fetch('/api/admin/page-block-images', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      id: image.id,
                      block_id: image.block_id,
                      image_url: image.image_url,
                      layout_type: imageLayoutType, // Используем текущий выбранный тип размещения
                      text_content: imageLayoutType === 'image_text_side' ? blockContent : undefined, // Обновляем текст, если тип размещения "Фото и текст"
                      sort_order: image.sort_order
                    })
                  });

                  if (!updateResponse.ok) {
                    console.error('Ошибка обновления изображения:', await updateResponse.text());
                  }
                })
              );
            }
          } catch (error) {
            console.error('Ошибка при обновлении изображений:', error);
          }
        }
      } else {
        // Создание нового блока
        const blocksInPage = blocks.filter(b => b.page_id === selectedPageId);
        const newSortOrder = blocksInPage.length;

        const response = await fetch('/api/admin/page-blocks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            page_id: selectedPageId,
            block_type: blockType,
            title: blockTitle,
            content: blockType === 'text' ? blockContent : undefined,
            sort_order: newSortOrder
          })
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Ошибка создания блока:', response.status, errorText);
          throw new Error(`Ошибка создания блока: ${response.status} ${errorText}`);
        }

        const newBlock = await response.json();
        setBlocks([...blocks, newBlock[0]]);

        // Обновляем imageFiles для нового блока
        setImageFiles([...imageFiles, { blockId: newBlock[0].id, urls: [] }]);

        // Привязываем изображение, которое было загружено для этой страницы
        const tempImagesForPage = imageFiles.find(item => item.blockId === `temp_for_${selectedPageId}`);
        if (tempImagesForPage && tempImagesForPage.urls.length > 0) {
          // Сохраняем только первое изображение (теперь у нас может быть только одно изображение на блок)
          try {
            const imageResponse = await fetch('/api/admin/page-block-images', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                block_id: newBlock[0].id,
                image_url: tempImagesForPage.urls[0],
                layout_type: blockType === 'photo' ? imageLayoutType : 'simple', // Используем layout_type для фото-блока
                text_content: blockType === 'photo' && imageLayoutType === 'image_text_side' ? blockContent : undefined, // Добавляем текст, если тип размещения "Фото и текст"
                sort_order: 0
              })
            });

            if (imageResponse.ok) {
              const newImage = await imageResponse.json();

              // Обновляем локальное состояние изображений
              setImages(prev => [...prev, newImage[0]]);

              // Удаляем обработанные временные изображения из состояния
              const updatedImageFiles = imageFiles.filter(item => item.blockId !== `temp_for_${selectedPageId}`);
              setImageFiles(updatedImageFiles);
            } else {
              console.error('Ошибка сохранения изображения для нового блока:', await imageResponse.text());
            }
          } catch (err) {
            console.error('Ошибка сохранения изображения для нового блока:', err);
          }
        }
      }

      // Сброс формы
      setBlockTitle('');
      setBlockType('text');
      setBlockContent('');
      setEditingBlockId(null);
      showNotification(editingBlockId ? 'Блок успешно обновлен!' : 'Блок успешно создан!', 'success');
    } catch (error: any) {
      console.error('Ошибка сохранения блока:', error);
      showNotification(error.message || 'Произошла ошибка при сохранении блока', 'error');
    }
  };

  const handleEditPage = (page: Page) => {
    setTitle(page.title);
    setSlug(page.slug);
    setEditingPageId(page.id);
    setActiveTab('pages');
  };

  const handleEditBlock = (block: PageBlock) => {
    setBlockTitle(block.title);
    setBlockType(block.block_type);

    // Для фото-блока с типом размещения "image_text_side" получаем текст из изображения
    if (block.block_type === 'photo') {
      const blockImage = images.find(img => img.block_id === block.id);
      if (blockImage && blockImage.layout_type === 'image_text_side') {
        setBlockContent(blockImage.text_content || '');
      } else {
        setBlockContent('');
      }
    } else {
      setBlockContent(block.content || '');
    }

    setEditingBlockId(block.id);
    setActiveTab('blocks');

    // Устанавливаем выбранную страницу для контекста
    setSelectedPageId(block.page_id);
  };

  const handleDeletePage = async (id: string) => {
    if (confirm('Вы уверены, что хотите удалить эту страницу? Все связанные блоки будут также удалены.')) {
      try {
        const response = await fetch(`/api/admin/pages?id=${id}`, {
          method: 'DELETE'
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Ошибка удаления страницы:', response.status, errorText);
          throw new Error(`Ошибка удаления страницы: ${response.status} ${errorText}`);
        }

        // Обновляем список страниц без удаленной
        const filteredPages = pages.filter(p => p.id !== id);
        setPages(filteredPages);

        // Также удаляем связанные блоки
        const filteredBlocks = blocks.filter(b => b.page_id !== id);
        setBlocks(filteredBlocks);

        // Обновляем изображения и ссылки
        const blockIds = blocks.filter(b => b.page_id === id).map(b => b.id);
        setImages(images.filter(img => !blockIds.includes(img.block_id)));
        setLinks(links.filter(l => !blockIds.includes(l.block_id)));

        // Обновляем imageFiles
        setImageFiles(imageFiles.filter(item => !blockIds.includes(item.blockId)));

        showNotification('Страница успешно удалена!', 'success');
      } catch (error: any) {
        console.error('Ошибка удаления страницы:', error);
        showNotification(error.message || 'Произошла ошибка при удалении страницы', 'error');
      }
    }
  };

  const handleDeleteBlock = async (id: string) => {
    if (confirm('Вы уверены, что хотите удалить этот блок?')) {
      try {
        const response = await fetch(`/api/admin/page-blocks?id=${id}`, {
          method: 'DELETE'
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Ошибка удаления блока');
        }

        // Обновляем список блоков без удаленного
        const filteredBlocks = blocks.filter(b => b.id !== id);
        setBlocks(filteredBlocks);
        
        // Удаляем связанные изображения и ссылки
        setImages(images.filter(img => img.block_id !== id));
        setLinks(links.filter(l => l.block_id !== id));
        
        // Обновляем imageFiles
        setImageFiles(imageFiles.filter(item => item.blockId !== id));

        showNotification('Блок успешно удален!', 'success');
      } catch (error: any) {
        console.error('Ошибка удаления блока:', error);
        showNotification(error.message || 'Произошла ошибка при удалении блока', 'error');
      }
    }
  };

  const moveBlockUp = (blockId: string) => {
    const blockToMove = blocks.find(b => b.id === blockId);
    if (!blockToMove || !selectedPageId) return;

    // Получаем все блоки на той же странице и сортируем их по sort_order
    const blocksInPage = [...blocks.filter(b => b.page_id === selectedPageId)].sort((a, b) => a.sort_order - b.sort_order);
    const currentIndex = blocksInPage.findIndex(b => b.id === blockId);

    if (currentIndex === 0) return; // Уже первый в странице

    // Меняем местами текущий блок с предыдущим
    [blocksInPage[currentIndex], blocksInPage[currentIndex - 1]] = [blocksInPage[currentIndex - 1], blocksInPage[currentIndex]];

    // Обновляем sort_order для блоков в странице
    const reorderedBlocksInPage = blocksInPage.map((block, idx) => ({
      ...block,
      sort_order: idx
    }));

    // Обновляем весь список блоков
    const updatedBlocks = blocks.map(block => {
      const updatedBlock = reorderedBlocksInPage.find(updated => updated.id === block.id);
      return updatedBlock || block;
    });

    // Обновляем состояние
    setBlocks(updatedBlocks);
    setHasUnsavedBlockChanges(true); // Устанавливаем флаг изменений
  };

  const moveBlockDown = (blockId: string) => {
    const blockToMove = blocks.find(b => b.id === blockId);
    if (!blockToMove || !selectedPageId) return;

    // Получаем все блоки на той же странице и сортируем их по sort_order
    const blocksInPage = [...blocks.filter(b => b.page_id === selectedPageId)].sort((a, b) => a.sort_order - b.sort_order);
    const currentIndex = blocksInPage.findIndex(b => b.id === blockId);

    if (currentIndex === blocksInPage.length - 1) return; // Уже последний в странице

    // Меняем местами текущий блок со следующим
    [blocksInPage[currentIndex], blocksInPage[currentIndex + 1]] = [blocksInPage[currentIndex + 1], blocksInPage[currentIndex]];

    // Обновляем sort_order для блоков в странице
    const reorderedBlocksInPage = blocksInPage.map((block, idx) => ({
      ...block,
      sort_order: idx
    }));

    // Обновляем весь список блоков
    const updatedBlocks = blocks.map(block => {
      const updatedBlock = reorderedBlocksInPage.find(updated => updated.id === block.id);
      return updatedBlock || block;
    });

    // Обновляем состояние
    setBlocks(updatedBlocks);
    setHasUnsavedBlockChanges(true); // Устанавливаем флаг изменений
  };

  const handleImageUpload = async (urls: string[], blockId: string, layoutType?: 'simple' | 'image_text_side' | 'banner' | 'horizontal_pair' | 'horizontal_triple' | 'grid_four', textContent?: string) => {
    try {
      // Если layoutType не передан, используем текущее значение
      const currentLayoutType = layoutType || imageLayoutType;

      // Если блок еще не создан (используем специальный ID для временных изображений)
      if (blockId.startsWith('temp_')) {
        // Обновляем imageFiles с временным ID, заменяем любые существующие изображения
        const updatedImageFiles = [...imageFiles];
        const existingIndex = updatedImageFiles.findIndex(item => item.blockId === blockId);

        if (existingIndex >= 0) {
          updatedImageFiles[existingIndex] = { blockId, urls };
        } else {
          updatedImageFiles.push({ blockId, urls });
        }
        setImageFiles(updatedImageFiles);

        // Обновляем локальное состояние с временным ID, заменяем любые существующие изображения
        const newImages = urls.map((url, index) => ({
          id: `temp-${Date.now()}-${index}`, // временный ID
          block_id: blockId,
          image_url: url,
          layout_type: currentLayoutType,
          text_content: currentLayoutType === 'image_text_side' ? textContent : undefined,
          sort_order: index,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));

        // Удаляем старые временные изображения для этого блока
        const filteredImages = images.filter(img => !img.block_id.startsWith('temp_') || img.block_id !== blockId);
        setImages([...filteredImages, ...newImages]);
      } else {
        // Проверяем, есть ли уже изображения для этого блока и удаляем их
        const existingImages = images.filter(img => img.block_id === blockId);
        for (const existingImage of existingImages) {
          try {
            // Удаляем изображение из базы данных
            const response = await fetch(`/api/admin/page-block-images?id=${existingImage.id}`, {
              method: 'DELETE'
            });

            if (!response.ok) {
              console.error('Ошибка удаления старого изображения:', await response.text());
            }
          } catch (err) {
            console.error('Ошибка при удалении старого изображения:', err);
          }
        }

        // Добавляем новое изображение в базу данных
        try {
          const response = await fetch('/api/admin/page-block-images', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              block_id: blockId,
              image_url: urls[0], // Берем только первое изображение
              layout_type: currentLayoutType,
              text_content: currentLayoutType === 'image_text_side' ? textContent : undefined,
              sort_order: 0
            })
          });

          if (response.ok) {
            const newImage = await response.json();

            // Удаляем старые изображения для этого блока из локального состояния
            const filteredImages = images.filter(img => img.block_id !== blockId);
            // Добавляем новое изображение
            setImages([...filteredImages, newImage[0]]);

            // Обновляем imageFiles
            const updatedImageFiles = [...imageFiles];
            const existingIndex = updatedImageFiles.findIndex(item => item.blockId === blockId);

            if (existingIndex >= 0) {
              updatedImageFiles[existingIndex] = { blockId, urls: [urls[0]] };
            } else {
              updatedImageFiles.push({ blockId, urls: [urls[0]] });
            }
            setImageFiles(updatedImageFiles);
          } else {
            console.error('Ошибка сохранения изображения:', await response.text());
            showNotification('Ошибка при сохранения изображения', 'error');
            return;
          }
        } catch (err) {
          console.error('Ошибка при запросе к API:', err);
          showNotification('Ошибка при сохранении изображения', 'error');
          return;
        }
      }

      showNotification('Изображение успешно добавлено!', 'success');
    } catch (error) {
      console.error('Ошибка при добавлении изображения:', error);
      showNotification('Ошибка при добавлении изображения', 'error');
    }
  };

  const handleLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingBlockId) {
      showNotification('Пожалуйста, выберите блок для добавления ссылки', 'error');
      return;
    }

    try {
      if (editingLinkId) {
        // Обновление существующей ссылки
        const response = await fetch('/api/admin/page-block-links', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            id: editingLinkId, 
            block_id: editingBlockId, 
            title: linkTitle, 
            url: linkUrl,
            sort_order: links.find(l => l.id === editingLinkId)?.sort_order || 0
          })
        });

        if (!response.ok) {
          throw new Error('Ошибка обновления ссылки');
        }

        const updatedLink = await response.json();
        const updatedLinks = links.map(l =>
          l.id === editingLinkId ? updatedLink[0] : l
        );
        setLinks(updatedLinks);
      } else {
        // Создание новой ссылки
        const linksInBlock = links.filter(l => l.block_id === editingBlockId);
        const newSortOrder = linksInBlock.length;

        const response = await fetch('/api/admin/page-block-links', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            block_id: editingBlockId, 
            title: linkTitle, 
            url: linkUrl,
            sort_order: newSortOrder
          })
        });

        if (!response.ok) {
          throw new Error('Ошибка создания ссылки');
        }

        const newLink = await response.json();
        setLinks([...links, newLink[0]]);
      }

      // Сброс формы
      setLinkTitle('');
      setLinkUrl('');
      setEditingLinkId(null);
      showNotification(editingLinkId ? 'Ссылка успешно обновлена!' : 'Ссылка успешно создана!', 'success');
    } catch (error: any) {
      console.error('Ошибка сохранения ссылки:', error);
      showNotification(error.message || 'Произошла ошибка при сохранении ссылки', 'error');
    }
  };

  const handleEditLink = (link: PageBlockLink) => {
    setLinkTitle(link.title);
    setLinkUrl(link.url);
    setEditingLinkId(link.id);
    
    // Находим соответствующий блок и устанавливаем его как редактируемый
    const block = blocks.find(b => b.id === link.block_id);
    if (block) {
      setEditingBlockId(block.id);
      setSelectedPageId(block.page_id);
    }
  };

  const handleDeleteLink = async (id: string) => {
    if (confirm('Вы уверены, что хотите удалить эту ссылку?')) {
      try {
        const response = await fetch(`/api/admin/page-block-links?id=${id}`, {
          method: 'DELETE'
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Ошибка удаления ссылки');
        }

        // Обновляем список ссылок без удаленной
        const filteredLinks = links.filter(l => l.id !== id);
        setLinks(filteredLinks);

        showNotification('Ссылка успешно удалена!', 'success');
      } catch (error: any) {
        console.error('Ошибка удаления ссылки:', error);
        showNotification(error.message || 'Произошла ошибка при удалении ссылки', 'error');
      }
    }
  };

  const moveLinkUp = async (linkId: string) => {
    const linkToMove = links.find(l => l.id === linkId);
    if (!linkToMove || !editingBlockId) return;

    // Получаем все ссылки в том же блоке
    const linksInBlock = links.filter(l => l.block_id === editingBlockId);
    const currentIndex = linksInBlock.findIndex(l => l.id === linkId);

    if (currentIndex === 0) return; // Уже первая в блоке

    // Создаем новый массив с обновленным порядком
    const newLinksInBlock = [...linksInBlock];
    const movedLink = newLinksInBlock.splice(currentIndex, 1)[0];
    newLinksInBlock.splice(currentIndex - 1, 0, movedLink);

    // Обновляем sort_order для ссылок в блоке
    const reorderedLinksInBlock = newLinksInBlock.map((link, idx) => ({
      ...link,
      sort_order: idx
    }));

    // Обновляем весь список ссылок
    const updatedLinks = links.map(link => {
      const updatedLink = reorderedLinksInBlock.find(updated => updated.id === link.id);
      return updatedLink || link;
    });

    // Обновляем порядок в базе данных с помощью массового обновления
    try {
      const updates = reorderedLinksInBlock.map(link => ({
        id: link.id,
        block_id: link.block_id,
        title: link.title,
        url: link.url,
        sort_order: link.sort_order
      }));

      const response = await fetch('/api/admin/page-block-links', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Ошибка обновления порядка ссылок: ${response.status} ${response.statusText}. ${errorText}`);
      }

      // Обновляем состояние только после успешного сохранения
      setLinks(updatedLinks);
    } catch (error) {
      console.error('Ошибка обновления порядка ссылок:', error);
      showNotification('Ошибка обновления порядка ссылок', 'error');
    }
  };

  const moveLinkDown = async (linkId: string) => {
    const linkToMove = links.find(l => l.id === linkId);
    if (!linkToMove || !editingBlockId) return;

    // Получаем все ссылки в том же блоке
    const linksInBlock = links.filter(l => l.block_id === editingBlockId);
    const currentIndex = linksInBlock.findIndex(l => l.id === linkId);

    if (currentIndex === linksInBlock.length - 1) return; // Уже последняя в блоке

    // Создаем новый массив с обновленным порядком
    const newLinksInBlock = [...linksInBlock];
    const movedLink = newLinksInBlock.splice(currentIndex, 1)[0];
    newLinksInBlock.splice(currentIndex + 1, 0, movedLink);

    // Обновляем sort_order для ссылок в блоке
    const reorderedLinksInBlock = newLinksInBlock.map((link, idx) => ({
      ...link,
      sort_order: idx
    }));

    // Обновляем весь список ссылок
    const updatedLinks = links.map(link => {
      const updatedLink = reorderedLinksInBlock.find(updated => updated.id === link.id);
      return updatedLink || link;
    });

    // Обновляем порядок в базе данных с помощью массового обновления
    try {
      const updates = reorderedLinksInBlock.map(link => ({
        id: link.id,
        block_id: link.block_id,
        title: link.title,
        url: link.url,
        sort_order: link.sort_order
      }));

      const response = await fetch('/api/admin/page-block-links', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Ошибка обновления порядка ссылок: ${response.status} ${response.statusText}. ${errorText}`);
      }

      // Обновляем состояние только после успешного сохранения
      setLinks(updatedLinks);
    } catch (error) {
      console.error('Ошибка обновления порядка ссылок:', error);
      showNotification('Ошибка обновления порядка ссылок', 'error');
    }
  };

  // Функция для сохранения изменений порядка блоков
  const saveBlockOrderChanges = async () => {
    if (!selectedPageId) return;

    try {
      // Получаем все блоки для текущей страницы с обновленным порядком
      const blocksInPage = blocks.filter(b => b.page_id === selectedPageId);

      // Отправляем все изменения в одном запросе
      const response = await fetch('/api/admin/page-blocks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          blocksInPage.map(block => ({
            id: block.id,
            page_id: block.page_id,
            block_type: block.block_type,
            title: block.title,
            content: block.content,
            sort_order: block.sort_order
          }))
        )
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка сохранения порядка блоков');
      }

      showNotification('Порядок блоков успешно сохранен!', 'success');
      setHasUnsavedBlockChanges(false); // Сбрасываем флаг изменений

      // Обновляем оригинальные блоки
      setOriginalBlocks([...blocks]);
    } catch (error: any) {
      console.error('Ошибка сохранения порядка блоков:', error);
      showNotification(error.message || 'Произошла ошибка при сохранении порядка блоков', 'error');
      // В случае ошибки восстанавливаем исходный порядок
      setBlocks([...originalBlocks]);
      setHasUnsavedBlockChanges(false);
    }
  };

  // Функция для отмены изменений порядка блоков
  const cancelBlockOrderChanges = () => {
    setBlocks([...originalBlocks]); // Восстанавливаем исходный порядок
    setHasUnsavedBlockChanges(false); // Сбрасываем флаг изменений
  };

  const handleDeleteImage = async (imageId: string, imageUrl: string) => {
    if (confirm('Вы уверены, что хотите удалить это изображение?')) {
      try {
        // Проверяем, является ли ID временным (не настоящим UUID)
        const isTemporaryId = /^temp-\d+|^\d+-\d+$/.test(imageId);

        if (!isTemporaryId) {
          // Если это настоящий ID, удаляем из базы данных
          const response = await fetch(`/api/admin/page-block-images?id=${imageId}`, {
            method: 'DELETE'
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Ошибка удаления изображения');
          }
        }

        // Обновляем список изображений без удаленного
        const filteredImages = images.filter(img => img.id !== imageId);
        setImages(filteredImages);

        // Обновляем imageFiles - удаляем изображение из соответствующей записи
        const updatedImageFiles = imageFiles.map(item => ({
          ...item,
          urls: item.urls.filter(url => url !== imageUrl)
        })).filter(item => item.urls.length > 0); // Удаляем пустые записи
        setImageFiles(updatedImageFiles);

        showNotification('Изображение успешно удалено!', 'success');
      } catch (error: any) {
        console.error('Ошибка удаления изображения:', error);
        showNotification(error.message || 'Произошла ошибка при удалении изображения', 'error');
      }
    }
  };

  if (loading) {
    return <div className="p-4">Загрузка...</div>;
  }

  return (
    <div className="p-6">
      {renderNotification()}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('pages')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'pages'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Страницы
          </button>
          <button
            onClick={() => setActiveTab('blocks')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'blocks'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Блоки
          </button>
        </nav>
      </div>

      {activeTab === 'pages' ? (
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            {editingPageId ? 'Редактировать страницу' : 'Добавить новую страницу'}
          </h2>

          <form onSubmit={handlePageSubmit} className="mb-8 p-4 bg-white rounded-lg shadow-md">
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="title">
                Название страницы
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="slug">
                URL-идентификатор (slug)
              </label>
              <input
                id="slug"
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                required
                placeholder="например: contacts или about"
              />
            </div>
            <div className="flex items-center justify-between">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              >
                {editingPageId ? 'Обновить' : 'Создать'}
              </button>
              {editingPageId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingPageId(null);
                    setTitle('');
                    setSlug('');
                  }}
                  className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                >
                  Отмена
                </button>
              )}
            </div>
          </form>

          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Название
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    URL
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pages.map((page) => (
                  <tr key={page.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{page.title}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">/{page.slug}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEditPage(page)}
                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                      >
                        Редактировать
                      </button>
                      <button
                        onClick={() => handleDeletePage(page.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Удалить
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Управление блоками</h2>
          
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="pageSelect">
              Выберите страницу
            </label>
            <select
              id="pageSelect"
              value={selectedPageId || ''}
              onChange={(e) => setSelectedPageId(e.target.value || null)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            >
              <option value="">Выберите страницу</option>
              {pages.map(page => (
                <option key={page.id} value={page.id}>
                  {page.title}
                </option>
              ))}
            </select>
          </div>

          {selectedPageId && (
            <>
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                {pages.find(p => p.id === selectedPageId)?.title}
              </h3>

              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                {editingBlockId ? 'Редактировать блок' : 'Добавить новый блок'}
              </h2>

              <form onSubmit={handleBlockSubmit} className="mb-8 p-4 bg-white rounded-lg shadow-md">
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="blockTitle">
                    Название блока
                  </label>
                  <input
                    id="blockTitle"
                    type="text"
                    value={blockTitle}
                    onChange={(e) => setBlockTitle(e.target.value)}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="blockType">
                    Тип блока
                  </label>
                  <select
                    id="blockType"
                    value={blockType}
                    onChange={(e) => setBlockType(e.target.value as any)}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  >
                    <option value="text">Текст</option>
                    <option value="photo">Фото</option>
                    <option value="links">Ссылки</option>
                  </select>
                </div>

                {blockType === 'text' && (
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="blockContent">
                      Текст
                    </label>
                    <textarea
                      id="blockContent"
                      value={blockContent}
                      onChange={(e) => setBlockContent(e.target.value)}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline h-32"
                      placeholder="Введите текст блока"
                    />
                  </div>
                )}

                {blockType === 'photo' && (
                  <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Тип размещения изображений
                    </label>
                    <select
                      value={imageLayoutType}
                      onChange={(e) => setImageLayoutType(e.target.value as any)}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-4"
                    >
                      <option value="simple">Простое</option>
                      <option value="image_text_side">Фото и текст</option>
                    </select>

                    {(imageLayoutType === 'image_text_side') && (
                      <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="imageTextContent">
                          Текст для отображения рядом с изображением
                        </label>
                        <textarea
                          id="imageTextContent"
                          value={blockContent}
                          onChange={(e) => setBlockContent(e.target.value)}
                          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline h-32"
                          placeholder="Введите текст, который будет отображаться рядом с изображением"
                        />
                      </div>
                    )}

                    {/* Отображение текущего изображения, если оно есть */}
                    {(editingBlockId && images.some(img => img.block_id === editingBlockId)) && (
                      <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2">
                          Текущее изображение
                        </label>
                        <div className="flex items-center">
                          <OptimizedImage
                            src={images.find(img => img.block_id === editingBlockId)?.image_url || ''}
                            alt="Текущее изображение блока"
                            width={96}
                            height={48}
                            className="h-16 w-32 object-cover rounded border"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              // Удаляем текущее изображение
                              const imageToDelete = images.find(img => img.block_id === editingBlockId);
                              if (imageToDelete) {
                                handleDeleteImage(imageToDelete.id, imageToDelete.image_url);
                              }
                            }}
                            className="ml-4 text-red-600 hover:text-red-800 text-sm"
                          >
                            Удалить изображение
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Форма загрузки изображения, если нет текущего изображения или создаем новый блок */}
                    {(!editingBlockId || !images.some(img => img.block_id === editingBlockId)) && (
                      <FileUpload
                        onFileUpload={(urls) => {
                          // Ограничиваем до одного изображения на блок
                          const currentImageExists = editingBlockId ? images.some(img => img.block_id === editingBlockId) : false;

                          if (currentImageExists) {
                            showNotification('Для одного блока можно загрузить только одно изображение', 'error');
                            return;
                          }

                          // Берем только первое изображение из загруженных
                          const firstImageUrl = urls[0];

                          // Если блок еще не создан (при создании нового блока), используем временный ID
                          const targetBlockId = editingBlockId ? editingBlockId : selectedPageId ? `temp_for_${selectedPageId}` : '';
                          if (targetBlockId) {
                            handleImageUpload([firstImageUrl], targetBlockId, imageLayoutType, blockContent);
                          }
                        }}
                        folder="page-blocks"
                        label="Загрузить изображение"
                        multiple={false}
                      />
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                  >
                    {editingBlockId ? 'Обновить' : 'Создать'}
                  </button>
                  {editingBlockId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingBlockId(null);
                        setBlockTitle('');
                        setBlockType('text');
                        setBlockContent('');
                      }}
                      className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                    >
                      Отмена
                    </button>
                  )}
                </div>
              </form>


              {/* Отображение блоков для выбранной страницы */}
              {blocks.filter(b => b.page_id === selectedPageId).length > 0 && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Блоки страницы</h3>
                  <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    {hasUnsavedBlockChanges && (
                      <div className="bg-yellow-50 border-b border-yellow-200 p-4 flex justify-between">
                        <span className="text-yellow-700">Есть несохраненные изменения порядка блоков</span>
                        <div className="space-x-2">
                          <button
                            onClick={saveBlockOrderChanges}
                            className="bg-green-600 hover:bg-green-700 text-white font-medium py-1 px-3 rounded text-sm"
                          >
                            Сохранить изменения
                          </button>
                          <button
                            onClick={cancelBlockOrderChanges}
                            className="bg-gray-500 hover:bg-gray-600 text-white font-medium py-1 px-3 rounded text-sm"
                          >
                            Отменить
                          </button>
                        </div>
                      </div>
                    )}
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Название
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Тип
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Перемещение
                          </th>
                          <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Действия
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {blocks
                          .filter(b => b.page_id === selectedPageId)
                          .sort((a, b) => a.sort_order - b.sort_order)
                          .map((block, index) => (
                            <tr key={block.id}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">{block.title}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                  {block.block_type === 'text' && 'Текст'}
                                  {block.block_type === 'photo' && 'Фото'}
                                  {block.block_type === 'links' && 'Ссылки'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => moveBlockUp(block.id)}
                                    disabled={index === 0}
                                    className={`p-1 rounded ${index === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:text-blue-600'}`}
                                    title="Переместить вверх"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                      <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => moveBlockDown(block.id)}
                                    disabled={index === blocks.filter(b => b.page_id === selectedPageId).length - 1}
                                    className={`p-1 rounded ${index === blocks.filter(b => b.page_id === selectedPageId).length - 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:text-blue-600'}`}
                                    title="Переместить вниз"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                  </button>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <button
                                  onClick={() => handleEditBlock(block)}
                                  className="text-indigo-600 hover:text-indigo-900 mr-4"
                                >
                                  Редактировать
                                </button>
                                <button
                                  onClick={() => handleDeleteBlock(block.id)}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  Удалить
                                </button>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Управление содержимым блоков */}
              {selectedPageId && (
                <>
                  {/* Ссылки-блоки */}
                  {blocks.filter(b => b.page_id === selectedPageId && b.block_type === 'links').map(block => (
                    <div key={`links-${block.id}`} className="mb-8">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Ссылки для блока "{block.title}"</h3>

                      <form onSubmit={handleLinkSubmit} className="mb-6 p-4 bg-gray-50 rounded-lg">
                        <div className="mb-4">
                          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="linkTitle">
                            Название ссылки
                          </label>
                          <input
                            id="linkTitle"
                            type="text"
                            value={linkTitle}
                            onChange={(e) => setLinkTitle(e.target.value)}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            required
                          />
                        </div>
                        <div className="mb-4">
                          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="linkUrl">
                            URL ссылки
                          </label>
                          <input
                            id="linkUrl"
                            type="text"
                            value={linkUrl}
                            onChange={(e) => setLinkUrl(e.target.value)}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            required
                            placeholder="https://example.com или /path/to/document.pdf"
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <button
                            type="submit"
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                          >
                            {editingLinkId ? 'Обновить' : 'Добавить'}
                          </button>
                          {editingLinkId && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingLinkId(null);
                                setLinkTitle('');
                                setLinkUrl('');
                              }}
                              className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                            >
                              Отмена
                            </button>
                          )}
                        </div>
                      </form>

                      {/* Отображение существующих ссылок */}
                      {links.filter(l => l.block_id === block.id).length > 0 && (
                        <div className="bg-white rounded-lg shadow-md overflow-hidden">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Название
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  URL
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Перемещение
                                </th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Действия
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {links
                                .filter(l => l.block_id === block.id)
                                .sort((a, b) => a.sort_order - b.sort_order)
                                .map((link, index) => (
                                  <tr key={link.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <div className="text-sm font-medium text-gray-900">{link.title}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <a
                                        href={link.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:underline break-all max-w-xs"
                                      >
                                        {link.url}
                                      </a>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      <div className="flex space-x-2">
                                        <button
                                          onClick={() => moveLinkUp(link.id)}
                                          disabled={index === 0}
                                          className={`p-1 rounded ${index === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:text-blue-600'}`}
                                          title="Переместить вверх"
                                        >
                                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                                          </svg>
                                        </button>
                                        <button
                                          onClick={() => moveLinkDown(link.id)}
                                          disabled={index === links.filter(l => l.block_id === block.id).length - 1}
                                          className={`p-1 rounded ${index === links.filter(l => l.block_id === block.id).length - 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:text-blue-600'}`}
                                          title="Переместить вниз"
                                        >
                                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                          </svg>
                                        </button>
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                      <button
                                        onClick={() => handleEditLink(link)}
                                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                                      >
                                        Редактировать
                                      </button>
                                      <button
                                        onClick={() => handleDeleteLink(link.id)}
                                        className="text-red-600 hover:text-red-900"
                                      >
                                        Удалить
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  ))}
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}