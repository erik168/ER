#/bin/sh

CURR_DIR=$(dirname "$0")
ER_DIR="${CURR_DIR}/.."

# read version
while getopts v:d: opt
do
    case $opt in
        v)  VER=$OPTARG ;;
        d)  DOCTOOL=$OPTARG ;;
    esac
done

if [ "X${DOCTOOL}" = "X" ]
then
    echo "DOCTOOL has not assigned!!"
    exit 1;
fi

ER_FILE="er-${VER}.js"
ESUI_FILE="esui-${VER}.js"
ESUICSS_FILE="esui-${VER}.css"

TEMP_DIR="release/er-${VER}"
SOURCE_DIR="src"
TOOL_DIR="tool"

if [ -e "${ER_DIR}/release/er-${VER}.tar.gz" ] 
then
    echo "version ${VER} is exist!"
    exit 1;
fi

# create temp dir
echo "===== process: create temp dir: ${TEMP_DIR}"
mkdir "${ER_DIR}/${TEMP_DIR}"
mkdir "${ER_DIR}/${TEMP_DIR}/release"

# pack doc
# u should be use docbook
echo "===== process: pack doc"
cp -r "${ER_DIR}/doc" "${ER_DIR}/${TEMP_DIR}/doc"
rm -f "${ER_DIR}/${TEMP_DIR}/doc/changelog.xml"
rm -rf "${ER_DIR}/${TEMP_DIR}/doc/er.graffle"
xsltproc     --stringparam  section.autolabel 1 \
             --stringparam  section.label.includes.component.label 1 \
             -o "${ER_DIR}/${TEMP_DIR}/doc/doc.html" "${DOCTOOL}" "${ER_DIR}/${TEMP_DIR}/doc/doc.xml" 
rm -f "${ER_DIR}/${TEMP_DIR}/doc/doc.xml"

cd "${ER_DIR}"

handleDebug() {
    cp "$1" "$1.pack"

    cat "$1" | 
        grep -v "__debug__" |
            sed s/\$\(\(esui\)\)/${ESUI_FILE}/g |
                sed s/\$\(\(er\)\)/${ER_FILE}/g | 
                    sed s/\$\(\(esuicss\)\)/${ESUICSS_FILE}/g > "$1.pack"

    rm -f "$1"
    mv "$1.pack" "$1"
}

dependOn() {
    if [ `grep "^$1$" "$2" | wc -l` != '0' ]
    then
        return 0;
    fi
    
    echo "$1" | sed "s/\./\//g" | sed "s/^/${SOURCE_DIR}\//g" | sed "s/$/\.js/g" |  
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
    
    sed '/^$/d' "$1.packlist" | sed '/^$/d' | sed 's/\./\//g' | sed 's/$/\.js/' | sed 's/^/src\//g' | 
         xargs cat > "${TEMP_DIR}/release/$1-${VER}.js"
    
    rm -f "$1.pack"
    rm -f "$1.packlist"
}

packCss() {
    grep "[css]" "${TOOL_DIR}/$1-css.manifest" | cut -d " " -f2 > "$1-css.pack"
    cat "$1-css.pack" | sed "s/^/src\/esui\/css\//g" | sed "s/$/\.css/g" | xargs cat > "${TEMP_DIR}/RELEASE/$1-${VER}.css" 
    rm -f "$1-css.pack"
}

# pack src
echo "===== process: pack src"
cp -r "src" "${TEMP_DIR}/src"
packJs "er-core"
packJs "er"
packJs "esui"
packCss "esui"

#pack sample
echo "===== process: pack sample"
cp -r "sample" "${TEMP_DIR}/sample"
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
cp "tool/tangram-1.3.9.js" "${TEMP_DIR}/tool/tangram-1.3.9.js"


# pack test
echo "===== process: pack test"
cp -r "test" "${TEMP_DIR}/test"
for file in $(ls ${TEMP_DIR}/test/*.html)
do
    handleDebug "$file"
done
for file in $(ls ${TEMP_DIR}/test/esui/*.html)
do
    handleDebug "$file"
done


# pack
cd "release"
tar zfvc "er-${VER}.tar.gz" "er-${VER}"

# remove temp dir
echo "===== process: rm temp dir: ${TEMP_DIR}"
rm -rf "er-${VER}"


