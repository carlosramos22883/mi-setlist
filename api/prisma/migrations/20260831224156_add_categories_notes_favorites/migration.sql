-- CreateTable
CREATE TABLE "song_categories" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "song_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "song_category_items" (
    "songId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,

    CONSTRAINT "song_category_items_pkey" PRIMARY KEY ("songId","categoryId")
);

-- CreateTable
CREATE TABLE "song_notes" (
    "id" TEXT NOT NULL,
    "songId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "song_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "favorite_songs" (
    "userId" TEXT NOT NULL,
    "songId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favorite_songs_pkey" PRIMARY KEY ("userId","songId")
);

-- CreateIndex
CREATE UNIQUE INDEX "song_categories_groupId_name_key" ON "song_categories"("groupId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "song_notes_songId_userId_key" ON "song_notes"("songId", "userId");

-- AddForeignKey
ALTER TABLE "song_categories" ADD CONSTRAINT "song_categories_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "song_category_items" ADD CONSTRAINT "song_category_items_songId_fkey" FOREIGN KEY ("songId") REFERENCES "songs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "song_category_items" ADD CONSTRAINT "song_category_items_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "song_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "song_notes" ADD CONSTRAINT "song_notes_songId_fkey" FOREIGN KEY ("songId") REFERENCES "songs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "song_notes" ADD CONSTRAINT "song_notes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorite_songs" ADD CONSTRAINT "favorite_songs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorite_songs" ADD CONSTRAINT "favorite_songs_songId_fkey" FOREIGN KEY ("songId") REFERENCES "songs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
