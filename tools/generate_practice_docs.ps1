$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$outDir = Join-Path $root "docs\practice"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

function Escape-XmlText {
    param([string]$Text)

    return [System.Security.SecurityElement]::Escape($Text)
}

function New-ParagraphXml {
    param(
        [string]$Text,
        [string]$Align = "both",
        [bool]$Bold = $false,
        [int]$Size = 24,
        [int]$After = 0
    )

    $boldXml = if ($Bold) { "<w:b/>" } else { "" }
    $safeText = Escape-XmlText $Text

    return @"
<w:p>
  <w:pPr>
    <w:jc w:val="$Align"/>
    <w:spacing w:line="240" w:lineRule="auto" w:after="$After"/>
  </w:pPr>
  <w:r>
    <w:rPr>
      <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/>
      $boldXml
      <w:sz w:val="$Size"/>
    </w:rPr>
    <w:t xml:space="preserve">$safeText</w:t>
  </w:r>
</w:p>
"@
}

function New-TableCellXml {
    param(
        [string]$Text,
        [int]$Width,
        [bool]$Bold = $false
    )

    $boldXml = if ($Bold) { "<w:b/>" } else { "" }
    $safeText = Escape-XmlText $Text

    return @"
<w:tc>
  <w:tcPr>
    <w:tcW w:w="$Width" w:type="dxa"/>
    <w:vAlign w:val="center"/>
    <w:tcMar>
      <w:top w:w="80" w:type="dxa"/>
      <w:left w:w="80" w:type="dxa"/>
      <w:bottom w:w="80" w:type="dxa"/>
      <w:right w:w="80" w:type="dxa"/>
    </w:tcMar>
  </w:tcPr>
  <w:p>
    <w:pPr>
      <w:jc w:val="both"/>
      <w:spacing w:line="240" w:lineRule="auto" w:after="0"/>
    </w:pPr>
    <w:r>
      <w:rPr>
        <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/>
        $boldXml
        <w:sz w:val="24"/>
      </w:rPr>
      <w:t xml:space="preserve">$safeText</w:t>
    </w:r>
  </w:p>
</w:tc>
"@
}

function New-TableRowXml {
    param([string[]]$Cells, [int[]]$Widths, [bool]$Header = $false)

    $cellXml = for ($i = 0; $i -lt $Cells.Count; $i++) {
        New-TableCellXml -Text $Cells[$i] -Width $Widths[$i] -Bold:$Header
    }

    return "<w:tr>$($cellXml -join '')</w:tr>"
}

function New-TableXml {
    param([string[][]]$Rows, [int[]]$Widths)

    $rowsXml = for ($i = 0; $i -lt $Rows.Count; $i++) {
        New-TableRowXml -Cells $Rows[$i] -Widths $Widths -Header:($i -eq 0)
    }

    return @"
<w:tbl>
  <w:tblPr>
    <w:tblW w:w="0" w:type="auto"/>
    <w:tblBorders>
      <w:top w:val="single" w:sz="6" w:space="0" w:color="000000"/>
      <w:left w:val="single" w:sz="6" w:space="0" w:color="000000"/>
      <w:bottom w:val="single" w:sz="6" w:space="0" w:color="000000"/>
      <w:right w:val="single" w:sz="6" w:space="0" w:color="000000"/>
      <w:insideH w:val="single" w:sz="6" w:space="0" w:color="000000"/>
      <w:insideV w:val="single" w:sz="6" w:space="0" w:color="000000"/>
    </w:tblBorders>
  </w:tblPr>
  <w:tblGrid>
    $(($Widths | ForEach-Object { "<w:gridCol w:w=""$_""/>" }) -join '')
  </w:tblGrid>
  $($rowsXml -join "`n")
</w:tbl>
"@
}

function New-Docx {
    param(
        [string]$OutputPath,
        [string]$BodyXml
    )

    $tempDir = Join-Path ([System.IO.Path]::GetTempPath()) ([System.Guid]::NewGuid().ToString("N"))
    New-Item -ItemType Directory -Force -Path $tempDir | Out-Null
    New-Item -ItemType Directory -Force -Path (Join-Path $tempDir "_rels") | Out-Null
    New-Item -ItemType Directory -Force -Path (Join-Path $tempDir "word") | Out-Null
    New-Item -ItemType Directory -Force -Path (Join-Path $tempDir "word\_rels") | Out-Null

    $contentTypes = @'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>
'@

    $rels = @'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>
'@

    $docRels = @'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
</Relationships>
'@

    $styles = @'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal">
    <w:name w:val="Normal"/>
    <w:qFormat/>
    <w:rPr>
      <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/>
      <w:sz w:val="24"/>
    </w:rPr>
  </w:style>
</w:styles>
'@

    $document = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    $BodyXml
    <w:sectPr>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="1134" w:right="850" w:bottom="1134" w:left="1134" w:header="708" w:footer="708" w:gutter="0"/>
    </w:sectPr>
  </w:body>
</w:document>
"@

    [System.IO.File]::WriteAllText((Join-Path $tempDir "[Content_Types].xml"), $contentTypes, [System.Text.UTF8Encoding]::new($false))
    [System.IO.File]::WriteAllText((Join-Path $tempDir "_rels\.rels"), $rels, [System.Text.UTF8Encoding]::new($false))
    [System.IO.File]::WriteAllText((Join-Path $tempDir "word\_rels\document.xml.rels"), $docRels, [System.Text.UTF8Encoding]::new($false))
    [System.IO.File]::WriteAllText((Join-Path $tempDir "word\styles.xml"), $styles, [System.Text.UTF8Encoding]::new($false))
    [System.IO.File]::WriteAllText((Join-Path $tempDir "word\document.xml"), $document, [System.Text.UTF8Encoding]::new($false))

    if (Test-Path $OutputPath) {
        Remove-Item -LiteralPath $OutputPath -Force
    }

    Add-Type -AssemblyName System.IO.Compression
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $archive = [System.IO.Compression.ZipFile]::Open($OutputPath, [System.IO.Compression.ZipArchiveMode]::Create)
    try {
        $files = Get-ChildItem -LiteralPath $tempDir -Recurse -File

        foreach ($file in $files) {
            $relativePath = $file.FullName.Substring($tempDir.Length).TrimStart('\', '/').Replace('\', '/')
            [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile(
                $archive,
                $file.FullName,
                $relativePath,
                [System.IO.Compression.CompressionLevel]::Optimal) | Out-Null
        }
    }
    finally {
        $archive.Dispose()
    }

    Remove-Item -LiteralPath $tempDir -Recurse -Force
}

$reportParagraphs = @(
    "Введение. В ходе практики было разработано учебное веб-приложение Event Management Platform, предназначенное для создания, публикации и сопровождения мероприятий. Продукт ориентирован на несколько типов пользователей: обычный участник может просматривать опубликованные события и регистрироваться на них, организатор может создавать собственные события и управлять ими, администратор получает расширенные права для проверки и сопровождения данных. Основная цель проекта заключалась в получении практического опыта full-stack разработки: от проектирования серверной части и базы данных до создания пользовательского интерфейса, запуска приложения в Docker и проверки основных сценариев работы.",
    "Назначение продукта. Платформа решает типовую задачу организации мероприятий: хранение списка событий, описание места и времени проведения, работа с билетами и вместимостью, регистрация участников, отметка присутствующих на входе и выгрузка списка участников. В качестве примера использования можно рассмотреть учебную конференцию. Организатор входит в систему, создает черновик события, указывает название, описание, категорию, город, адрес, площадку, дату начала и окончания. После этого он добавляет билет, задает количество мест и публикует событие. Посетитель видит опубликованное мероприятие в общем списке, выбирает билет и записывается. Система выдает код check-in, который позднее используется организатором для отметки участника на входе.",
    "Техническая архитектура. Приложение построено по принципам Clean Architecture. Решение разделено на четыре основных проекта: Domain, Application, Infrastructure и API. В Domain находятся основные бизнес-сущности: Event, Ticket, Registration, User и EventCategory. Там же определены value objects, например Email, Money, EventLocation, EventDescription и типизированные идентификаторы. Такой подход помогает отделить бизнес-правила от деталей базы данных и HTTP-запросов. Application содержит DTO, команды и интерфейсы сервисов, через которые внешние слои обращаются к сценариям приложения. Infrastructure реализует хранение данных через Entity Framework Core и PostgreSQL, содержит миграции, конфигурации сущностей, seed-данные и сервисы работы с событиями, регистрациями и авторизацией. API отвечает за прием HTTP-запросов, настройку dependency injection, Swagger и авторизацию.",
    "Серверная часть реализована на ASP.NET Core Web API с контроллерами. Основные endpoint-ы включают получение списка событий, просмотр деталей события, создание и редактирование события, публикацию и отмену, создание билетов, регистрацию участника, просмотр регистраций пользователя, просмотр списка участников события, check-in по коду, загрузку календарного файла .ics и экспорт участников в CSV. Для авторизации используется JWT: после регистрации или входа пользователь получает access token, который отправляется в защищенные запросы. Роль пользователя влияет на доступные действия. Участник может записываться на события, организатор может управлять своими событиями, администратор имеет расширенный доступ. Дополнительно реализована защита от самоназначения роли Admin при публичной регистрации.",
    "База данных и контейнеризация. В качестве СУБД используется PostgreSQL. Данные хранятся в таблицах пользователей, событий, категорий, билетов и регистраций. Для работы с базой применяется EF Core, миграции позволяют воспроизводимо создавать структуру базы. В Docker Compose описаны три контейнера: PostgreSQL, API и frontend. При запуске API может автоматически применять миграции и добавлять начальные данные, что упрощает проверку проекта на другой машине. В локальном окружении frontend доступен по адресу http://localhost:5173, API - по адресу http://localhost:5000, Swagger - по адресу http://localhost:5000/swagger, а PostgreSQL проброшен на порт 5433.",
    "Пользовательский интерфейс. Frontend реализован на React, TypeScript и Vite. Интерфейс содержит боковую панель со списком событий, поиском, фильтрацией по статусу и категории, а также основную область с деталями выбранного события. Для события отображаются описание, категория, город, адрес, дата и время, билеты, режимы регистрации и check-in, а также блок календаря. Если пользователь вошел как организатор и событие принадлежит ему, открываются дополнительные элементы управления: редактирование события, добавление билетов, публикация или отмена, включение и отключение регистрации и check-in, просмотр участников и отметка присутствующих. Для обычного участника доступны регистрация на опубликованное событие и просмотр собственных регистраций.",
    "Пример работы участника. Пользователь открывает веб-приложение и видит список доступных мероприятий. Он выбирает событие, знакомится с описанием, временем проведения и списком билетов. Если регистрация открыта, пользователь выбирает билет и отправляет форму. При наличии аккаунта данные участника берутся из профиля, при гостевом сценарии можно указать имя и email вручную. После успешной регистрации система показывает check-in код. В личном блоке пользователь может увидеть свои регистрации, статус события и код для входа на мероприятие.",
    "Пример работы организатора. Организатор регистрируется или входит в систему, переходит во вкладку создания события и заполняет основные поля. Новое событие создается как черновик, поэтому оно не сразу доступно для регистрации. После проверки данных организатор добавляет билет, публикует событие и при необходимости включает или выключает режим регистрации. В день проведения он может включить check-in, открыть список участников, увидеть общее количество записей, количество отмеченных и ожидающих вход. При вводе check-in кода участник переводится в статус CheckedIn. Также организатор может скачать CSV-файл со списком участников для последующей обработки или отчетности.",
    "Интеграция с календарем. Для каждого события реализована возможность скачать файл формата .ics. Такой файл можно импортировать в календарное приложение, например Outlook, Google Calendar или календарь операционной системы. При изменении события в системе обновляются служебные данные календаря, включая версию и время обновления. В текущем MVP реализован прямой скачиваемый файл, а полноценная подписка на календарь может быть добавлена позднее после размещения приложения на публичном сервере.",
    "Проверка и результат. В ходе разработки были проверены основные сценарии: получение списка событий из PostgreSQL, просмотр деталей, регистрация участника, блокировка повторной регистрации, проверка вместимости билета, создание события организатором, добавление билета, публикация, работа dashboard, просмотр участников, check-in по коду, скачивание .ics и CSV. Для backend добавлены автоматические тесты на регистрацию, ограничения вместимости, повторную регистрацию, check-in и проверки ролей. Также была выполнена сборка решения .NET, сборка frontend, запуск через Docker Compose и проверка доступности API и frontend. В результате получен завершенный MVP веб-платформы управления событиями, который демонстрирует работу клиентской и серверной частей, базы данных, авторизации, ролей, контейнеризации и основных бизнес-сценариев."
)

$reportBody = @()
$reportBody += New-ParagraphXml -Text "Отчет по практике" -Align "center" -Bold $true -Size 32 -After 120
$reportBody += New-ParagraphXml -Text "Разработка веб-платформы Event Management Platform" -Align "center" -Bold $true -Size 28 -After 200
foreach ($paragraph in $reportParagraphs) {
    $reportBody += New-ParagraphXml -Text $paragraph -Align "both" -Size 24 -After 80
}

$diaryRows = @(
    @("Дата", "Содержание выполненных работы", "Отметка о выполнении (примечание)", "Подпись руководителя практики"),
    @("30.06.2026", "Создан репозиторий проекта. Подготовлена структура решения по принципам Clean Architecture: Domain, Application, Infrastructure и API. Настроен стартовый ASP.NET Core Web API, Swagger и предсказуемый локальный порт запуска.", "Выполнено", ""),
    @("01.07.2026", "Подключена инфраструктура PostgreSQL через EF Core. Создан ApplicationDbContext, конфигурации сущностей, первая миграция и начальная документация по архитектуре, настройке и roadmap проекта.", "Выполнено", ""),
    @("02.07.2026", "Реализованы основные серверные сценарии: получение деталей события, создание события, публикация и отмена, регистрация участника, check-in по коду и просмотр регистраций события. Добавлен базовый React/Vite frontend.", "Выполнено", ""),
    @("03.07.2026", "Добавлены пользовательские сценарии frontend: регистрация на событие, панель участников организатора, check-in форма. Реализована основа авторизации: регистрация, вход, JWT token и защита организаторских запросов.", "Выполнено", ""),
    @("05.07.2026", "Добавлены создание событий через frontend, создание билетов, экспорт события в календарный файл .ics, редактирование событий и переключение списка между всеми событиями и событиями текущего организатора.", "Выполнено", ""),
    @("06.07.2026", "Уточнены права доступа: скрыты элементы управления для чужих событий, добавлены публикация и отмена события с frontend, режимы регистрации и check-in, регистрации, связанные с аккаунтом, и dashboard организатора.", "Выполнено", ""),
    @("07.07.2026", "Выполнена структурная очистка frontend: выделены отдельные компоненты для авторизации, создания события, регистрации участника, списка участников, боковой панели, билетов, управления событием и деталей события.", "Выполнено", ""),
    @("08.07.2026", "Подготовлен визуальный референс в Pencil. Выполнена первая полировка интерфейса: темная рабочая область, улучшение расположения панелей, деталей события и визуальных состояний.", "Выполнено", ""),
    @("11.07.2026", "Доработан пользовательский интерфейс: фильтры по статусу и категории, счетчики в списке событий, сводка вместимости билетов, контекст регистрации, сводка участников, русские статусы, календарная панель и группировка форм.", "Выполнено", ""),
    @("12.07.2026", "Проведена ручная проверка MVP. Добавлены проверки вместимости билетов, исправление Content-Type для защищенных запросов, фильтрация категорий, backend-тесты, ролевой доступ, обновленный README, визуальная полировка, CSV-экспорт участников и финальная проверка Docker Compose.", "Выполнено", "")
)

$diaryBody = @()
$diaryBody += New-ParagraphXml -Text "ДНЕВНИК" -Align "center" -Bold $true -Size 32 -After 60
$diaryBody += New-ParagraphXml -Text "учебной, ознакомительной практики" -Align "center" -Size 24 -After 160
$diaryBody += New-ParagraphXml -Text "_________________________________________________________________________________" -Align "center" -Size 24
$diaryBody += New-ParagraphXml -Text "(ФИО обучающегося(-ейся) полностью)" -Align "center" -Size 22 -After 100
$diaryBody += New-ParagraphXml -Text "Обучающегося(-ейся) 2 курса                                               учебная группа ИВТ-ВПб24о-1" -Align "both" -Size 24 -After 160
$diaryBody += New-TableXml -Rows $diaryRows -Widths @(1450, 6100, 2100, 2100)
$diaryBody += New-ParagraphXml -Text "________________________     _________________" -Align "right" -Size 24 -After 0
$diaryBody += New-ParagraphXml -Text "Ф.И.О. руководителя по практике        (подпись)" -Align "right" -Size 22

$reportPath = Join-Path $outDir "EventManagement_Report.docx"
$diaryPath = Join-Path $outDir "EventManagement_Diary.docx"

New-Docx -OutputPath $reportPath -BodyXml ($reportBody -join "`n")
New-Docx -OutputPath $diaryPath -BodyXml ($diaryBody -join "`n")

[PSCustomObject]@{
    Report = $reportPath
    Diary = $diaryPath
}

