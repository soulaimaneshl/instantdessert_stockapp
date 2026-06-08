package com.instantdessert.stockapp.data.db

import androidx.room.TypeConverter
import com.instantdessert.stockapp.data.db.entity.*

class Converters {
    @TypeConverter fun fromUnite(v: Unite): String = v.name
    @TypeConverter fun toUnite(v: String): Unite = Unite.valueOf(v)

    @TypeConverter fun fromCanal(v: Canal): String = v.name
    @TypeConverter fun toCanal(v: String): Canal = Canal.valueOf(v)

    @TypeConverter fun fromTypeMouvement(v: TypeMouvement): String = v.name
    @TypeConverter fun toTypeMouvement(v: String): TypeMouvement = TypeMouvement.valueOf(v)

    @TypeConverter fun fromEntiteType(v: EntiteType): String = v.name
    @TypeConverter fun toEntiteType(v: String): EntiteType = EntiteType.valueOf(v)
}
