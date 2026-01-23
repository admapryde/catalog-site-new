'use client';

import { useState, useEffect } from 'react';
import { Page, PageBlock, PageBlockImage, PageBlockLink } from '@/types';
import FileUpload from '@/components/admin/FileUpload';
import OptimizedImage from '@/components/OptimizedImage';
import { useNotification } from '@/hooks/useNotification';

export default function PagesManager() {
  const [pages, setPages] = useState<Page[]>([]);
  const [blocks, setBlocks] = useState<PageBlock[]>([]);
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

        // Если есть временные изображения, привязываем их к новому блоку
        const tempImages = images.filter(img => img.block_id === 'temp');
        if (tempImages.length > 0) {
          for (const tempImage of tempImages) {
            try {
              const imageResponse = await fetch('/api/admin/page-block-images', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  block_id: newBlock[0].id,
                  image_url: tempImage.image_url,
                  layout_type: tempImage.layout_type,
                  sort_order: tempImage.sort_order
                })
              });

              if (imageResponse.ok) {
                // Удаляем временное изображение из состояния
                setImages(prev => prev.filter(img => img.id !== tempImage.id));
              }
            } catch (err) {
              console.error('Ошибка сохранения временного изображения:', err);
            }
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
    setBlockContent(block.content || '');
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

  const moveBlockUp = async (blockId: string) => {
    const blockToMove = blocks.find(b => b.id === blockId);
    if (!blockToMove || !selectedPageId) return;

    // Получаем все блоки на той же странице
    const blocksInPage = blocks.filter(b => b.page_id === selectedPageId);
    const currentIndex = blocksInPage.findIndex(b => b.id === blockId);

    if (currentIndex === 0) return; // Уже первый в странице

    // Создаем новый массив с обновленным порядком
    const newBlocksInPage = [...blocksInPage];
    const movedBlock = newBlocksInPage.splice(currentIndex, 1)[0];
    newBlocksInPage.splice(currentIndex - 1, 0, movedBlock);

    // Обновляем sort_order для блоков в странице
    const reorderedBlocksInPage = newBlocksInPage.map((block, idx) => ({
      ...block,
      sort_order: idx
    }));

    // Обновляем весь список блоков
    const updatedBlocks = blocks.map(block => {
      const updatedBlock = reorderedBlocksInPage.find(updated => updated.id === block.id);
      return updatedBlock || block;
    });

    // Обновляем порядок в базе данных
    try {
      await Promise.all(
        reorderedBlocksInPage.map(block =>
          fetch('/api/admin/page-blocks', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: block.id,
              page_id: block.page_id,
              block_type: block.block_type,
              title: block.title,
              content: block.content,
              sort_order: block.sort_order
            })
          })
        )
      );

      // Обновляем состояние только после успешного сохранения
      setBlocks(updatedBlocks);
    } catch (error) {
      console.error('Ошибка обновления порядка блоков:', error);
      showNotification('Ошибка обновления порядка блоков', 'error');
    }
  };

  const moveBlockDown = async (blockId: string) => {
    const blockToMove = blocks.find(b => b.id === blockId);
    if (!blockToMove || !selectedPageId) return;

    // Получаем все блоки на той же странице
    const blocksInPage = blocks.filter(b => b.page_id === selectedPageId);
    const currentIndex = blocksInPage.findIndex(b => b.id === blockId);

    if (currentIndex === blocksInPage.length - 1) return; // Уже последний в странице

    // Создаем новый массив с обновленным порядком
    const newBlocksInPage = [...blocksInPage];
    const movedBlock = newBlocksInPage.splice(currentIndex, 1)[0];
    newBlocksInPage.splice(currentIndex + 1, 0, movedBlock);

    // Обновляем sort_order для блоков в странице
    const reorderedBlocksInPage = newBlocksInPage.map((block, idx) => ({
      ...block,
      sort_order: idx
    }));

    // Обновляем весь список блоков
    const updatedBlocks = blocks.map(block => {
      const updatedBlock = reorderedBlocksInPage.find(updated => updated.id === block.id);
      return updatedBlock || block;
    });

    // Обновляем порядок в базе данных
    try {
      await Promise.all(
        reorderedBlocksInPage.map(block =>
          fetch('/api/admin/page-blocks', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: block.id,
              page_id: block.page_id,
              block_type: block.block_type,
              title: block.title,
              content: block.content,
              sort_order: block.sort_order
            })
          })
        )
      );

      // Обновляем состояние только после успешного сохранения
      setBlocks(updatedBlocks);
    } catch (error) {
      console.error('Ошибка обновления порядка блоков:', error);
      showNotification('Ошибка обновления порядка блоков', 'error');
    }
  };

  const handleImageUpload = async (urls: string[], blockId: string) => {
    try {
      // Добавляем новые изображения в базу данных
      for (let i = 0; i < urls.length; i++) {
        const sortOrder = i; // Порядок изображений в блоке
        
        await fetch('/api/admin/page-block-images', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            block_id: blockId,
            image_url: urls[i],
            layout_type: imageLayoutType,
            sort_order: sortOrder
          })
        });
      }

      // Обновляем локальное состояние
      const newImages = urls.map((url, index) => ({
        id: `${Date.now()}-${index}`, // временный ID
        block_id: blockId,
        image_url: url,
        layout_type: imageLayoutType,
        is_main: false, // По умолчанию не главное изображение
        sort_order: index,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));
      
      setImages([...images, ...newImages]);
      
      // Обновляем imageFiles
      const updatedImageFiles = [...imageFiles];
      const existingIndex = updatedImageFiles.findIndex(item => item.blockId === blockId);
      if (existingIndex >= 0) {
        updatedImageFiles[existingIndex] = {
          ...updatedImageFiles[existingIndex],
          urls: [...updatedImageFiles[existingIndex].urls, ...urls]
        };
      } else {
        updatedImageFiles.push({ blockId, urls });
      }
      setImageFiles(updatedImageFiles);

      showNotification('Изображения успешно добавлены!', 'success');
    } catch (error) {
      console.error('Ошибка при добавлении изображений:', error);
      showNotification('Ошибка при добавлении изображений', 'error');
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

    // Обновляем порядок в базе данных
    try {
      await Promise.all(
        reorderedLinksInBlock.map(link =>
          fetch('/api/admin/page-block-links', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: link.id,
              block_id: link.block_id,
              title: link.title,
              url: link.url,
              sort_order: link.sort_order
            })
          })
        )
      );

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

    // Обновляем порядок в базе данных
    try {
      await Promise.all(
        reorderedLinksInBlock.map(link =>
          fetch('/api/admin/page-block-links', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: link.id,
              block_id: link.block_id,
              title: link.title,
              url: link.url,
              sort_order: link.sort_order
            })
          })
        )
      );

      // Обновляем состояние только после успешного сохранения
      setLinks(updatedLinks);
    } catch (error) {
      console.error('Ошибка обновления порядка ссылок:', error);
      showNotification('Ошибка обновления порядка ссылок', 'error');
    }
  };

  const handleDeleteImage = async (imageId: string, imageUrl: string) => {
    if (confirm('Вы уверены, что хотите удалить это изображение?')) {
      try {
        // Проверяем, является ли ID временным (не настоящим UUID)
        // Временные ID создаются как `${Date.now()}-${index}`
        const isTemporaryId = /^\d+-\d+$/.test(imageId);

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

        // Обновляем imageFiles
        const updatedImageFiles = imageFiles.map(item => ({
          ...item,
          urls: item.urls.filter(url => url !== imageUrl)
        }));
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

                {blockType === 'photo' && editingBlockId && (
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
                      <option value="banner">Баннер</option>
                      <option value="horizontal_pair">Два фото горизонтально</option>
                      <option value="horizontal_triple">Три фото горизонтально</option>
                      <option value="grid_four">Четыре фото сеткой</option>
                      <option value="image_text_side">Фото и текст рядом</option>
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

                    <FileUpload
                      onFileUpload={(urls) => {
                        // Ограничиваем количество изображений до 4
                        const currentImagesCount = images.filter(img => img.block_id === editingBlockId).length;
                        const remainingSlots = 4 - currentImagesCount;

                        if (remainingSlots <= 0) {
                          showNotification('Можно загрузить максимум 4 изображения для одного блока', 'error');
                          return;
                        }

                        const limitedUrls = urls.slice(0, remainingSlots);
                        handleImageUpload(limitedUrls, editingBlockId);

                        if (urls.length > remainingSlots) {
                          showNotification(`Загружено только ${remainingSlots} из ${urls.length} изображений (максимум 4)`, 'error');
                        }
                      }}
                      folder="page-blocks"
                      label="Загрузить изображения (максимум 4)"
                      multiple={true}
                    />

                    {/* Отображение загруженных изображений для текущего редактируемого блока */}
                    {images.filter(img => img.block_id === editingBlockId).length > 0 && (
                      <div className="mt-6">
                        <h4 className="text-md font-semibold text-gray-700 mb-3">Выберите главное изображение:</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {images
                            .filter(img => img.block_id === editingBlockId)
                            .sort((a, b) => a.sort_order - b.sort_order)
                            .map((image) => (
                              <div key={image.id} className="relative">
                                <div className="flex items-center mb-2">
                                  <input
                                    type="radio"
                                    id={`main-image-${image.id}`}
                                    name={`main-image-${editingBlockId}`}
                                    checked={image.is_main || false}
                                    onChange={() => {
                                      // Обновляем изображения, устанавливая текущее как главное
                                      const updatedImages = images.map(img => ({
                                        ...img,
                                        is_main: img.id === image.id
                                      }));
                                      setImages(updatedImages);

                                      // Также обновляем в базе данных
                                      fetch('/api/admin/page-block-images', {
                                        method: 'PUT',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                          id: image.id,
                                          block_id: image.block_id,
                                          image_url: image.image_url,
                                          layout_type: image.layout_type,
                                          sort_order: image.sort_order,
                                          is_main: true
                                        })
                                      }).catch(err => console.error('Ошибка обновления главного изображения:', err));

                                      // Сбрасываем остальные изображения этого блока в is_main: false
                                      const otherImages = images.filter(img => img.block_id === editingBlockId && img.id !== image.id);
                                      otherImages.forEach(otherImg => {
                                        fetch('/api/admin/page-block-images', {
                                          method: 'PUT',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({
                                            id: otherImg.id,
                                            block_id: otherImg.block_id,
                                            image_url: otherImg.image_url,
                                            layout_type: otherImg.layout_type,
                                            sort_order: otherImg.sort_order,
                                            is_main: false
                                          })
                                        }).catch(err => console.error('Ошибка обновления изображения:', err));
                                      });
                                    }}
                                    className="mr-2"
                                  />
                                  <label htmlFor={`main-image-${image.id}`} className="text-xs text-gray-600 truncate flex-1">
                                    Главное
                                  </label>
                                </div>
                                <OptimizedImage
                                  src={image.image_url}
                                  alt={`Изображение для блока ${blocks.find(b => b.id === editingBlockId)?.title}`}
                                  width={200}
                                  height={150}
                                  className={`rounded-lg object-cover w-full h-32 ${image.is_main ? 'ring-2 ring-blue-500' : ''}`}
                                />
                                <button
                                  type="button"
                                  onClick={() => handleDeleteImage(image.id, image.image_url)}
                                  className="absolute top-1 right-1 text-red-500 hover:text-red-700 bg-white rounded-full w-6 h-6 flex items-center justify-center z-10"
                                >
                                  ✕
                                </button>
                                <p className="text-xs mt-1 text-center truncate">{image.layout_type}</p>
                              </div>
                            ))}
                        </div>
                      </div>
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