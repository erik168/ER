#/bin/sh


TOOL_DIR=$(dirname "$0")
ER_DIR="${TOOL_DIR}/.."
SOURCE_DIR="${ER_DIR}/src"

# read version
while getopts v:d:t: opt
do
    case $opt in
        v)  VER=$OPTARG ;;
        d)  DOCTOOL=$OPTARG ;;
		t)  TAR_DIR=$OPTARG ;;
    esac
done

if [ "X${DOCTOOL}" = "X" ]
then
    echo "DOCTOOL has not assigned!!"
    exit 1;
fi

TAR_FILE="er-${VER}.tar.gz"
ER_FILE="er-${VER}.js"
ESUI_FILE="esui-${VER}.js"
ESUICSS_FILE="esui-${VER}.css"

TEMP_DIR="${TAR_DIR}/er-${VER}"


if [ ! -d "${TAR_DIR}" ]
then
	echo "${TAR_DIR} is not exist!"
	exit 1;
fi


if [ -e "${TAR_DIR}/${TAR_FILE}" ] 
then
    echo "version ${VER} is exist!"
    exit 1;
fi

# create temp dir
echo "===== process: create temp dir: ${TEMP_DIR}"
mkdir "${TEMP_DIR}"
mkdir "${TEMP_DIR}/release"

# pack doc
# u should be use docbook
echo "===== process: pack doc"
cp -r "${ER_DIR}/doc" "${TEMP_DIR}/doc"
rm -rf "${TEMP_DIR}/doc/er.graffle"
xsltproc     --stringparam  section.autolabel 1 \
             --stringparam  section.label.includes.component.label 1 \
             -o "${TEMP_DIR}/doc/doc.html" "${DOCTOOL}" "${TEMP_DIR}/doc/doc.xml" 
for xml in $(ls ${TEMP_DIR}/doc/esui/*.xml)
do
    filename=$(basename "${xml}" | awk -F'.' '{print $1 ".html"}')
    xsltproc    --stringparam  section.autolabel 1 \
				--stringparam  section.label.includes.component.label 1 \
				-o "${TEMP_DIR}/doc/esui/${filename}" "${DOCTOOL}" "${xml}" 
	rm -f "${xml}"
done
rm -f "${TEMP_DIR}/doc/doc.xml"


handleDebug() {
    cp "$1" "$1.pack"

    cat "$1" | 
        grep -v "__debug__" |
            sed "s:\$((esui)):${ESUI_FILE}:g" |
                sed "s:\$((er)):${ER_FILE}:g" | 
                    sed "s:\$((esuicss)):${ESUICSS_FILE}:g" > "$1.pack"

    rm -f "$1"
    mv "$1.pack" "$1"
}

dependOn() {
    if [ `grep "^$1$" "$2" | wc -l` != '0' ]
    then
        return 0;
    fi
    
    echo "$1" | sed "s/\./\//g" | sed "s:^:${SOURCE_DIR}/:g" | sed "s/$/\.js/g" |  
        xargs grep "import e" > "$1.temp2"

    awk -F ' ' '$0~/import/{print $2;}' "$1.temp2" | sed "s/;[[:space:]]*$//g" > "$1.temp"
    rm -f "$1.temp2"
    cp "$1.temp" "$1.temp2"
    
    for a in $(cat "$1.temp")
    do
        dependOn "$a" "$2"
    done

    rm -f "$1.temp2"
    rm -f "$1.temp"
    echo "$1" >> "$2"
}

packJs() {
    if [ "X$2" = "X" ] 
    then
        echo "" > "$1.pack"
        echo "" > "$1.packlist"
    fi

    grep "[js]" "${TOOL_DIR}/$1.manifest" | cut -d " " -f2 >> "$1.pack"
    for name in $(cat "$1.pack")
    do
        dependOn "$name" "$1.packlist" 
    done
    
    sed '/^$/d' "$1.packlist" | sed '/^$/d' | sed 's/\./\//g' | sed 's/$/\.js/' | sed "s:^:${SOURCE_DIR}/:g" | 
         xargs cat > "${TEMP_DIR}/release/$1-${VER}.js"
    
    rm -f "$1.pack"
    rm -f "$1.packlist"
}

packCss() {
    grep "[css]" "${TOOL_DIR}/$1-css.manifest" | cut -d " " -f2 > "$1-css.pack"
    cat "$1-css.pack" | sed "s:^:${SOURCE_DIR}/esui/css/:g" | sed "s/$/\.css/g" | xargs cat > "${TEMP_DIR}/release/$1-${VER}.css" 
    rm -f "$1-css.pack"
}

# pack src
echo "===== process: pack src"
cp -r "${SOURCE_DIR}" "${TEMP_DIR}/src"
cp -r "${SOURCE_DIR}/esui/css/img" "${TEMP_DIR}/release/img"
for psd in $(ls ${TEMP_DIR}/release/img/*.psd)
do
	rm -f "${psd}"
done
packJs "er-core"
packJs "er"
packJs "esui"
packCss "esui"

#pack sample
echo "===== process: pack sample"
cp -r "${ER_DIR}/sample" "${TEMP_DIR}/sample"
for file in $(ls ${TEMP_DIR}/sample/asset/*.js | grep -v tangram)
do
    handleDebug "$file"
done
for file in $(ls ${TEMP_DIR}/sample/asset/*.css)
do
    handleDebug "$file"
done


#pack tool
echo "===== process: pack tool"
mkdir "${TEMP_DIR}/tool"
cp "${TOOL_DIR}/tangram-1.3.9.js" "${TEMP_DIR}/tool/tangram-1.3.9.js"


# pack test
echo "===== process: pack test"
cp -r "${ER_DIR}/test" "${TEMP_DIR}/test"
for file in $(ls ${TEMP_DIR}/test/*.html)
do
    handleDebug "$file"
done
for file in $(ls ${TEMP_DIR}/test/esui/*.html)
do
    handleDebug "$file"
done


# pack
cd "${TAR_DIR}"
tar zfc "${TAR_FILE}" "er-${VER}"

# remove temp dir
echo "===== process: rm temp dir: ${TEMP_DIR}"
rm -rf "er-${VER}"


